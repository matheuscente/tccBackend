import { ForbiddenError } from "../../../shared/errors/forbidden.error";
import { NotFoundError } from "../../../shared/errors/not-found-error";
import { ValidationError } from "../../../shared/errors/validation-error";
import type { IOwnershipService } from "../../../shared/ownership/ownership-service.interface";
import type { IScopeService } from "../../../shared/scope/interfaces/scope-service.interface";
import type { AuthUserDTO } from "../../../shared/DTOs/auth-user.DTO";
import type { INoteRepository } from "../interfaces/repositories/note-repository.interface";
import { makeNote } from "../../../tests/factories/make-note";
import { NoteService } from "./note.service";

describe("NoteService", () => {

  const noteRepositoryMock: jest.Mocked<INoteRepository> = {
    create: jest.fn(),
    findById: jest.fn(),
    findAllByUserId: jest.fn(),
    update: jest.fn(),
    softDelete: jest.fn(),
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

  const adminAuthUser: AuthUserDTO = { id: "admin-id", role: "ADMIN", sessionId: "default" };
  const userAuthUser: AuthUserDTO = { id: "user-id", role: "USER", sessionId: "default" };

  const service = new NoteService(noteRepositoryMock, ownershipMock, scopeServiceMock);

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
  });

  describe("create", () => {
    it("should create a note for the authenticated user", async () => {
      const note = makeNote({ userId: userAuthUser.id });
      noteRepositoryMock.create.mockResolvedValue(note);

      const result = await service.create(userAuthUser, { title: "  my note ", content: "text", courseId: "course-id" });

      expect(scopeServiceMock.normalize).toHaveBeenCalledWith(expect.objectContaining({ courseId: "course-id" }));
      expect(scopeServiceMock.resolveOwned).toHaveBeenCalledWith({ ...emptyScope, courseId: "course-id" }, userAuthUser.id);
      expect(noteRepositoryMock.create).toHaveBeenCalledWith({
        userId: userAuthUser.id,
        title: "my note",
        content: "text",
        ...emptyScope,
        courseId: "course-id",
      });
      expect(result).toEqual({
        id: note.id,
        title: note.title,
        content: note.content,
        courseId: note.courseId,
        moduleId: note.moduleId,
        disciplineId: note.disciplineId,
        createdAt: note.createdAt.toISOString(),
        updatedAt: note.updatedAt.toISOString(),
      });
    });

    it("should create a note without scope and with empty content", async () => {
      noteRepositoryMock.create.mockResolvedValue(makeNote({ userId: userAuthUser.id }));

      await service.create(userAuthUser, { title: "t" });

      expect(noteRepositoryMock.create).toHaveBeenCalledWith({ userId: userAuthUser.id, title: "t", content: "", ...emptyScope });
    });

    it("should ignore userId and always create the note for the authenticated user (even ADMIN)", async () => {
      noteRepositoryMock.create.mockResolvedValue(makeNote({ userId: adminAuthUser.id }));

      await service.create(adminAuthUser, { title: "t", userId: userAuthUser.id });

      expect(ownershipMock.resolveOwnerId).not.toHaveBeenCalled();
      expect(noteRepositoryMock.create).toHaveBeenCalledWith(expect.objectContaining({ userId: adminAuthUser.id }));
    });

    it("should propagate ValidationError when more than one scope is informed", async () => {
      scopeServiceMock.normalize.mockImplementation(() => { throw new ValidationError("Informe apenas um escopo: curso, módulo ou disciplina") });

      await expect(service.create(userAuthUser, { title: "t", courseId: "c", moduleId: "m" })).rejects.toThrow(ValidationError);
      expect(noteRepositoryMock.create).not.toHaveBeenCalled();
    });

    it("should propagate ForbiddenError when scope belongs to another user", async () => {
      scopeServiceMock.resolveOwned.mockRejectedValue(new ForbiddenError());

      await expect(service.create(adminAuthUser, { title: "t", courseId: "user-course" })).rejects.toThrow(ForbiddenError);
      expect(scopeServiceMock.resolveOwned).toHaveBeenCalledWith(expect.anything(), adminAuthUser.id);
      expect(noteRepositoryMock.create).not.toHaveBeenCalled();
    });
  });

  describe("findById", () => {
    it("should return the owner's note", async () => {
      const note = makeNote({ userId: userAuthUser.id });
      noteRepositoryMock.findById.mockResolvedValue(note);

      const result = await service.findById(userAuthUser, note.id);

      expect(ownershipMock.validateStrictOwnership).toHaveBeenCalledWith(userAuthUser, userAuthUser.id);
      expect(result?.id).toBe(note.id);
    });

    it("should return null when note does not exist", async () => {
      noteRepositoryMock.findById.mockResolvedValue(null);

      await expect(service.findById(userAuthUser, "missing")).resolves.toBeNull();
    });

    it("should throw ForbiddenError when another user tries to read the note", async () => {
      noteRepositoryMock.findById.mockResolvedValue(makeNote({ userId: "other-user" }));

      await expect(service.findById(userAuthUser, "id")).rejects.toThrow(ForbiddenError);
    });

    it("should throw ForbiddenError when ADMIN tries to read another user's note", async () => {
      noteRepositoryMock.findById.mockResolvedValue(makeNote({ userId: userAuthUser.id }));

      await expect(service.findById(adminAuthUser, "id")).rejects.toThrow(ForbiddenError);
      expect(ownershipMock.validateOwnership).not.toHaveBeenCalled();
    });
  });

  describe("findAllByUserId", () => {
    it("should list the user's notes with filter", async () => {
      const notes = [makeNote({ userId: userAuthUser.id }), makeNote({ userId: userAuthUser.id })];
      noteRepositoryMock.findAllByUserId.mockResolvedValue(notes);

      const filter = { moduleId: "module-id", search: "abc" };
      const result = await service.findAllByUserId(userAuthUser, userAuthUser.id, filter);

      expect(noteRepositoryMock.findAllByUserId).toHaveBeenCalledWith(userAuthUser.id, filter);
      expect(result.map(note => note.id)).toEqual(notes.map(note => note.id));
    });

    it("should throw ForbiddenError when ADMIN lists another user's notes", async () => {
      await expect(service.findAllByUserId(adminAuthUser, userAuthUser.id, {})).rejects.toThrow(ForbiddenError);
      expect(ownershipMock.validateOwnership).not.toHaveBeenCalled();
      expect(noteRepositoryMock.findAllByUserId).not.toHaveBeenCalled();
    });

    it("should throw ForbiddenError when USER lists another user's notes", async () => {
      await expect(service.findAllByUserId(userAuthUser, "other-user", {})).rejects.toThrow(ForbiddenError);
      expect(noteRepositoryMock.findAllByUserId).not.toHaveBeenCalled();
    });
  });

  describe("update", () => {
    it("should update title and content without touching the scope", async () => {
      const note = makeNote({ userId: userAuthUser.id, courseId: "course-id" });
      noteRepositoryMock.findById.mockResolvedValue(note);
      noteRepositoryMock.update.mockResolvedValue(note);

      await service.update(userAuthUser, note.id, { title: " new title ", content: "new content" });

      expect(scopeServiceMock.normalize).not.toHaveBeenCalled();
      expect(scopeServiceMock.resolveOwned).not.toHaveBeenCalled();
      expect(noteRepositoryMock.update).toHaveBeenCalledWith(note.id, { title: "new title", content: "new content" });
    });

    it("should change the scope and validate it against the note owner", async () => {
      const note = makeNote({ userId: userAuthUser.id, courseId: "course-id" });
      noteRepositoryMock.findById.mockResolvedValue(note);
      noteRepositoryMock.update.mockResolvedValue(note);

      await service.update(userAuthUser, note.id, { disciplineId: "discipline-id" });

      expect(scopeServiceMock.resolveOwned).toHaveBeenCalledWith({ ...emptyScope, disciplineId: "discipline-id" }, userAuthUser.id);
      expect(noteRepositoryMock.update).toHaveBeenCalledWith(note.id, { courseId: null, moduleId: null, disciplineId: "discipline-id" });
    });

    it("should allow removing the scope", async () => {
      const note = makeNote({ userId: userAuthUser.id, courseId: "course-id" });
      noteRepositoryMock.findById.mockResolvedValue(note);
      noteRepositoryMock.update.mockResolvedValue(note);

      await service.update(userAuthUser, note.id, { courseId: null });

      expect(noteRepositoryMock.update).toHaveBeenCalledWith(note.id, emptyScope);
    });

    it("should throw NotFoundError when note does not exist", async () => {
      noteRepositoryMock.findById.mockResolvedValue(null);

      await expect(service.update(userAuthUser, "missing", { title: "t" })).rejects.toThrow(NotFoundError);
      expect(noteRepositoryMock.update).not.toHaveBeenCalled();
    });

    it("should throw ForbiddenError when ADMIN updates another user's note", async () => {
      noteRepositoryMock.findById.mockResolvedValue(makeNote({ userId: userAuthUser.id }));

      await expect(service.update(adminAuthUser, "id", { title: "t" })).rejects.toThrow(ForbiddenError);
      expect(noteRepositoryMock.update).not.toHaveBeenCalled();
    });

    it("should not update when new scope belongs to another user", async () => {
      noteRepositoryMock.findById.mockResolvedValue(makeNote({ userId: userAuthUser.id }));
      scopeServiceMock.resolveOwned.mockRejectedValue(new ForbiddenError());

      await expect(service.update(userAuthUser, "id", { courseId: "foreign-course" })).rejects.toThrow(ForbiddenError);
      expect(noteRepositoryMock.update).not.toHaveBeenCalled();
    });
  });

  describe("softDelete", () => {
    it("should soft delete the owner's note", async () => {
      const note = makeNote({ userId: userAuthUser.id });
      noteRepositoryMock.findById.mockResolvedValue(note);

      await service.softDelete(userAuthUser, note.id);

      expect(noteRepositoryMock.softDelete).toHaveBeenCalledWith(note.id);
    });

    it("should be idempotent when note does not exist", async () => {
      noteRepositoryMock.findById.mockResolvedValue(null);

      await expect(service.softDelete(userAuthUser, "missing")).resolves.toBeUndefined();
      expect(noteRepositoryMock.softDelete).not.toHaveBeenCalled();
    });

    it("should throw ForbiddenError when ADMIN deletes another user's note", async () => {
      noteRepositoryMock.findById.mockResolvedValue(makeNote({ userId: userAuthUser.id }));

      await expect(service.softDelete(adminAuthUser, "id")).rejects.toThrow(ForbiddenError);
      expect(noteRepositoryMock.softDelete).not.toHaveBeenCalled();
    });
  });
});
