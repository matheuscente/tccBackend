import { AuthorizationError } from "../../../shared/errors/authorization.error";
import { ForbiddenError } from "../../../shared/errors/forbidden.error";
import { NotFoundError } from "../../../shared/errors/not-found-error";
import { ValidationError } from "../../../shared/errors/validation-error";
import type { IOwnershipService } from "../../../shared/ownership/ownership-service.interface";
import type { IScopeService } from "../../../shared/scope/scope-service.interface";
import type { IStorageProvider } from "../../../shared/storage/storage-provider.interface";
import type { IFileTokenService } from "../../../shared/file-token/file-token.service";
import type { AuthUserDTO } from "../../../shared/DTOs/auth-user.DTO";
import type { IFileRepository } from "../interfaces/repositories/file-repository.interface";
import { makeFile, makeUploadedFile } from "../../../tests/factories/make-file";
import { FileService, USER_STORAGE_QUOTA_BYTES } from "./file.service";

describe("FileService", () => {

  const fileRepositoryMock: jest.Mocked<IFileRepository> = {
    create: jest.fn(),
    findById: jest.fn(),
    findAllByUserId: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    sumSizeByUserId: jest.fn(),
  };

  const storageMock: jest.Mocked<IStorageProvider> = {
    name: "local",
    put: jest.fn(),
    getStream: jest.fn(),
    delete: jest.fn(),
  };

  const ownershipMock: jest.Mocked<IOwnershipService> = {
    resolveOwnerId: jest.fn(),
    validateOwnership: jest.fn(),
    validateStrictOwnership: jest.fn(),
  };

  const scopeServiceMock: jest.Mocked<IScopeService> = {
    normalize: jest.fn(),
    resolveOwned: jest.fn(),
    isWithin: jest.fn(),
  };

  const fileTokenServiceMock: jest.Mocked<IFileTokenService> = {
    sign: jest.fn(),
    verify: jest.fn(),
  };

  const adminAuthUser: AuthUserDTO = { id: "admin-id", role: "ADMIN", sessionId: "default" };
  const userAuthUser: AuthUserDTO = { id: "user-id", role: "USER", sessionId: "default" };

  const publicApiUrl = "http://api.test";

  const service = new FileService(fileRepositoryMock, storageMock, ownershipMock, scopeServiceMock, fileTokenServiceMock, publicApiUrl);

  const emptyScope = { courseId: null, moduleId: null, disciplineId: null };

  beforeEach(() => {
    jest.clearAllMocks();
    ownershipMock.validateStrictOwnership.mockImplementation((user, ownerId) => {
      if (user.id !== ownerId) throw new ForbiddenError("Ação não autorizada");
    });
    scopeServiceMock.normalize.mockImplementation((scope) => ({
      courseId: scope.courseId ?? null,
      moduleId: scope.moduleId ?? null,
      disciplineId: scope.disciplineId ?? null,
    }));
    scopeServiceMock.resolveOwned.mockResolvedValue(null);
    fileRepositoryMock.sumSizeByUserId.mockResolvedValue(0);
    storageMock.put.mockResolvedValue();
    storageMock.delete.mockResolvedValue();
  });

  describe("upload", () => {
    it("should store the file and save its metadata", async () => {
      const uploaded = makeUploadedFile({ originalname: "Report.PDF", size: 500 });
      const stored = makeFile({ userId: userAuthUser.id, originalName: "Report.PDF", size: 500 });
      fileRepositoryMock.create.mockResolvedValue(stored);

      const result = await service.upload(userAuthUser, uploaded, { courseId: "course-id" });

      expect(scopeServiceMock.resolveOwned).toHaveBeenCalledWith({ ...emptyScope, courseId: "course-id" }, userAuthUser.id);
      expect(fileRepositoryMock.sumSizeByUserId).toHaveBeenCalledWith(userAuthUser.id);

      const storageKey = storageMock.put.mock.calls[0]![0];
      expect(storageKey).toMatch(new RegExp(`^users/${userAuthUser.id}/[0-9a-f-]{36}\\.pdf$`));
      expect(storageMock.put).toHaveBeenCalledWith(storageKey, uploaded.buffer, "application/pdf");

      expect(fileRepositoryMock.create).toHaveBeenCalledWith({
        userId: userAuthUser.id,
        originalName: "Report.PDF",
        mimeType: "application/pdf",
        size: 500,
        storageKey,
        ...emptyScope,
        courseId: "course-id",
      });
      expect(result).toEqual({
        id: stored.id,
        originalName: stored.originalName,
        mimeType: stored.mimeType,
        size: stored.size,
        courseId: stored.courseId,
        moduleId: stored.moduleId,
        disciplineId: stored.disciplineId,
        createdAt: stored.createdAt.toISOString(),
      });
      expect(result).not.toHaveProperty("storageKey");
    });

    it("should sanitize the original name and default the mime type", async () => {
      fileRepositoryMock.create.mockResolvedValue(makeFile());

      await service.upload(userAuthUser, makeUploadedFile({ originalname: '../a:b*c?"d<e>f|.txt', mimetype: "" }), {});

      expect(fileRepositoryMock.create).toHaveBeenCalledWith(expect.objectContaining({
        originalName: ".._a_b_c__d_e_f_.txt",
        mimeType: "application/octet-stream",
      }));
      expect(storageMock.put).toHaveBeenCalledWith(expect.stringMatching(/\.txt$/), expect.any(Buffer), "application/octet-stream");
    });

    it("should use a default name when the sanitized name is empty", async () => {
      fileRepositoryMock.create.mockResolvedValue(makeFile());

      await service.upload(userAuthUser, makeUploadedFile({ originalname: "   " }), {});

      expect(fileRepositoryMock.create).toHaveBeenCalledWith(expect.objectContaining({ originalName: "arquivo" }));
    });

    it("should always upload for the authenticated user (ADMIN cannot upload for others)", async () => {
      fileRepositoryMock.create.mockResolvedValue(makeFile({ userId: adminAuthUser.id }));

      await service.upload(adminAuthUser, makeUploadedFile(), {});

      expect(fileRepositoryMock.create).toHaveBeenCalledWith(expect.objectContaining({ userId: adminAuthUser.id }));
      expect(storageMock.put).toHaveBeenCalledWith(expect.stringMatching(/^users\/admin-id\//), expect.any(Buffer), expect.any(String));
    });

    it("should throw ValidationError when no file is sent", async () => {
      await expect(service.upload(userAuthUser, undefined, {})).rejects.toThrow("Selecione um arquivo para enviar");
      expect(storageMock.put).not.toHaveBeenCalled();
    });

    it("should throw ValidationError when file is empty", async () => {
      await expect(service.upload(userAuthUser, makeUploadedFile({ size: 0 }), {})).rejects.toThrow("O arquivo está vazio");
      expect(storageMock.put).not.toHaveBeenCalled();
    });

    it("should throw ValidationError when the quota would be exceeded", async () => {
      fileRepositoryMock.sumSizeByUserId.mockResolvedValue(USER_STORAGE_QUOTA_BYTES - 100);

      const promise = service.upload(userAuthUser, makeUploadedFile({ size: 101 }), {});

      await expect(promise).rejects.toThrow(ValidationError);
      await expect(service.upload(userAuthUser, makeUploadedFile({ size: 101 }), {})).rejects.toThrow("Limite de armazenamento (2 GB) atingido");
      expect(storageMock.put).not.toHaveBeenCalled();
      expect(fileRepositoryMock.create).not.toHaveBeenCalled();
    });

    it("should allow an upload that fills the quota exactly", async () => {
      fileRepositoryMock.sumSizeByUserId.mockResolvedValue(USER_STORAGE_QUOTA_BYTES - 100);
      fileRepositoryMock.create.mockResolvedValue(makeFile());

      await service.upload(userAuthUser, makeUploadedFile({ size: 100 }), {});

      expect(storageMock.put).toHaveBeenCalledTimes(1);
    });

    it("should propagate ForbiddenError when scope belongs to another user", async () => {
      scopeServiceMock.resolveOwned.mockRejectedValue(new ForbiddenError());

      await expect(service.upload(userAuthUser, makeUploadedFile(), { courseId: "foreign" })).rejects.toThrow(ForbiddenError);
      expect(storageMock.put).not.toHaveBeenCalled();
    });

    it("should remove the stored object when saving metadata fails", async () => {
      fileRepositoryMock.create.mockRejectedValue(new Error("db error"));

      await expect(service.upload(userAuthUser, makeUploadedFile(), {})).rejects.toThrow("db error");

      const storageKey = storageMock.put.mock.calls[0]![0];
      expect(storageMock.delete).toHaveBeenCalledWith(storageKey);
    });

    it("should propagate the original error even if storage cleanup fails", async () => {
      fileRepositoryMock.create.mockRejectedValue(new Error("db error"));
      storageMock.delete.mockRejectedValue(new Error("storage error"));

      await expect(service.upload(userAuthUser, makeUploadedFile(), {})).rejects.toThrow("db error");
      expect(storageMock.delete).toHaveBeenCalledTimes(1);
    });

    it("should not save metadata when storage put fails", async () => {
      storageMock.put.mockRejectedValue(new Error("storage error"));

      await expect(service.upload(userAuthUser, makeUploadedFile(), {})).rejects.toThrow("storage error");
      expect(fileRepositoryMock.create).not.toHaveBeenCalled();
    });
  });

  describe("findById", () => {
    it("should return the owner's file", async () => {
      const file = makeFile({ userId: userAuthUser.id });
      fileRepositoryMock.findById.mockResolvedValue(file);

      const result = await service.findById(userAuthUser, file.id);

      expect(ownershipMock.validateStrictOwnership).toHaveBeenCalledWith(userAuthUser, userAuthUser.id);
      expect(result.id).toBe(file.id);
    });

    it("should throw NotFoundError when file does not exist", async () => {
      fileRepositoryMock.findById.mockResolvedValue(null);

      await expect(service.findById(userAuthUser, "missing")).rejects.toThrow(NotFoundError);
    });

    it("should throw ForbiddenError when ADMIN accesses another user's file", async () => {
      fileRepositoryMock.findById.mockResolvedValue(makeFile({ userId: userAuthUser.id }));

      await expect(service.findById(adminAuthUser, "id")).rejects.toThrow(ForbiddenError);
      expect(ownershipMock.validateOwnership).not.toHaveBeenCalled();
    });
  });

  describe("findAllByUserId", () => {
    it("should list the owner's files", async () => {
      const files = [makeFile({ userId: userAuthUser.id })];
      fileRepositoryMock.findAllByUserId.mockResolvedValue(files);

      const filter = { courseId: "course-id" };
      const result = await service.findAllByUserId(userAuthUser, userAuthUser.id, filter);

      expect(fileRepositoryMock.findAllByUserId).toHaveBeenCalledWith(userAuthUser.id, filter);
      expect(result).toHaveLength(1);
    });

    it("should throw ForbiddenError when ADMIN lists another user's files", async () => {
      await expect(service.findAllByUserId(adminAuthUser, userAuthUser.id, {})).rejects.toThrow(ForbiddenError);
      expect(fileRepositoryMock.findAllByUserId).not.toHaveBeenCalled();
    });
  });

  describe("update", () => {
    it("should rename the file with a sanitized name", async () => {
      const file = makeFile({ userId: userAuthUser.id });
      fileRepositoryMock.findById.mockResolvedValue(file);
      fileRepositoryMock.update.mockResolvedValue(file);

      await service.update(userAuthUser, file.id, { originalName: " new/name.pdf " });

      expect(scopeServiceMock.normalize).not.toHaveBeenCalled();
      expect(fileRepositoryMock.update).toHaveBeenCalledWith(file.id, { originalName: "new_name.pdf" });
    });

    it("should change the scope", async () => {
      const file = makeFile({ userId: userAuthUser.id });
      fileRepositoryMock.findById.mockResolvedValue(file);
      fileRepositoryMock.update.mockResolvedValue(file);

      await service.update(userAuthUser, file.id, { moduleId: "module-id" });

      expect(scopeServiceMock.resolveOwned).toHaveBeenCalledWith({ ...emptyScope, moduleId: "module-id" }, userAuthUser.id);
      expect(fileRepositoryMock.update).toHaveBeenCalledWith(file.id, { ...emptyScope, moduleId: "module-id" });
    });

    it("should throw ForbiddenError when ADMIN updates another user's file", async () => {
      fileRepositoryMock.findById.mockResolvedValue(makeFile({ userId: userAuthUser.id }));

      await expect(service.update(adminAuthUser, "id", { originalName: "x" })).rejects.toThrow(ForbiddenError);
      expect(fileRepositoryMock.update).not.toHaveBeenCalled();
    });

    it("should throw NotFoundError when file does not exist", async () => {
      fileRepositoryMock.findById.mockResolvedValue(null);

      await expect(service.update(userAuthUser, "missing", { originalName: "x" })).rejects.toThrow(NotFoundError);
    });
  });

  describe("delete", () => {
    it("should delete metadata and stored object", async () => {
      const file = makeFile({ userId: userAuthUser.id });
      fileRepositoryMock.findById.mockResolvedValue(file);

      await service.delete(userAuthUser, file.id);

      expect(fileRepositoryMock.delete).toHaveBeenCalledWith(file.id);
      expect(storageMock.delete).toHaveBeenCalledWith(file.storageKey);
    });

    it("should be idempotent when file does not exist", async () => {
      fileRepositoryMock.findById.mockResolvedValue(null);

      await expect(service.delete(userAuthUser, "missing")).resolves.toBeUndefined();
      expect(fileRepositoryMock.delete).not.toHaveBeenCalled();
      expect(storageMock.delete).not.toHaveBeenCalled();
    });

    it("should ignore storage errors after deleting metadata", async () => {
      fileRepositoryMock.findById.mockResolvedValue(makeFile({ userId: userAuthUser.id }));
      storageMock.delete.mockRejectedValue(new Error("storage error"));

      await expect(service.delete(userAuthUser, "id")).resolves.toBeUndefined();
    });

    it("should throw ForbiddenError when ADMIN deletes another user's file", async () => {
      fileRepositoryMock.findById.mockResolvedValue(makeFile({ userId: userAuthUser.id }));

      await expect(service.delete(adminAuthUser, "id")).rejects.toThrow(ForbiddenError);
      expect(fileRepositoryMock.delete).not.toHaveBeenCalled();
      expect(storageMock.delete).not.toHaveBeenCalled();
    });
  });

  describe("createAccess", () => {
    it("should sign a file token and build view and download urls", async () => {
      const file = makeFile({ userId: userAuthUser.id });
      fileRepositoryMock.findById.mockResolvedValue(file);
      fileTokenServiceMock.sign.mockReturnValue("a+b/c=");

      const result = await service.createAccess(userAuthUser, file.id);

      expect(fileTokenServiceMock.sign).toHaveBeenCalledWith({ sub: file.id, kind: "file" });
      expect(result).toEqual({
        viewUrl: `${publicApiUrl}/files/${file.id}/content?token=a%2Bb%2Fc%3D`,
        downloadUrl: `${publicApiUrl}/files/${file.id}/content?token=a%2Bb%2Fc%3D&download=1`,
        expiresInSeconds: 1800,
      });
    });

    it("should throw ForbiddenError when ADMIN requests access to another user's file", async () => {
      fileRepositoryMock.findById.mockResolvedValue(makeFile({ userId: userAuthUser.id }));

      await expect(service.createAccess(adminAuthUser, "id")).rejects.toThrow(ForbiddenError);
      expect(fileTokenServiceMock.sign).not.toHaveBeenCalled();
    });
  });

  describe("resolveByToken", () => {
    it("should return the file referenced by the token", async () => {
      const file = makeFile();
      fileTokenServiceMock.verify.mockReturnValue({ sub: file.id, kind: "file" });
      fileRepositoryMock.findById.mockResolvedValue(file);

      const result = await service.resolveByToken("token");

      expect(fileTokenServiceMock.verify).toHaveBeenCalledWith("token", "file");
      expect(fileRepositoryMock.findById).toHaveBeenCalledWith(file.id);
      expect(result).toBe(file);
    });

    it("should propagate AuthorizationError for invalid tokens", async () => {
      fileTokenServiceMock.verify.mockImplementation(() => { throw new AuthorizationError("Link do arquivo inválido ou expirado") });

      await expect(service.resolveByToken("bad")).rejects.toThrow(AuthorizationError);
      expect(fileRepositoryMock.findById).not.toHaveBeenCalled();
    });

    it("should throw NotFoundError when file no longer exists", async () => {
      fileTokenServiceMock.verify.mockReturnValue({ sub: "missing", kind: "file" });
      fileRepositoryMock.findById.mockResolvedValue(null);

      await expect(service.resolveByToken("token")).rejects.toThrow("Arquivo não encontrado");
    });
  });
});
