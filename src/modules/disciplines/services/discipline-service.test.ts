import { AuthorizationError } from "../../../shared/errors/authorization.error";
import { NotFoundError } from "../../../shared/errors/not-found-error";
import type { IOwnershipService } from "../../../shared/ownership/ownership-service.interface";
import type { Isanitize } from "../../../shared/sanitize/interfaces/sanitize.interface";
import type { AuthUserDTO } from "../../../shared/DTOs/auth-user.DTO";
import type { IDisciplineRepository } from "../interfaces/repositories/discipline-repository.interface";
import type { IModuleRepository } from "../../modules/interfaces/repositories/module-repository.interface";
import type { ITransaction } from "../../transaction/interfaces/transaction.interface";
import { DisciplineService } from "./discipline.service";
import { makeDiscipline } from "../../../tests/factories/make-discipline";
import { makeModule } from "../../../tests/factories/make-module";
import { makeCourse } from "../../../tests/factories/make-course";
import type { DisciplineWithCourseDTO } from "../DTOs/discipline-with-course-DTO";

describe("DisciplineService", () => {

  const disciplineRepositoryMock: jest.Mocked<IDisciplineRepository> = {
    findById: jest.fn(),
    findAllByModuleId: jest.fn(),
    findAllByModuleIdWithOwner: jest.fn(),
    findByIdWithOwner: jest.fn(),
    findAllByUserId: jest.fn(),
    findByIdWithCourse: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    softDelete: jest.fn(),
    softDeleteAllByModuleIds: jest.fn(),
  };

  const moduleRepositoryMock: jest.Mocked<IModuleRepository> = {
    findById: jest.fn(),
    findAllByCourseId: jest.fn(),
    findAllByCourseIdWithOwner: jest.fn(),
    findByIdWithOwner: jest.fn(),
    findByIdWithCourse: jest.fn(),
    findAllByUserId: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    softDelete: jest.fn(),
    softDeleteAllByCourseIds: jest.fn(),
  };

  const sanitizeMock: jest.Mocked<Isanitize> = {
    removeAccents: jest.fn(),
    sanitizeName: jest.fn(),
    sanitizeUsername: jest.fn(),
  };

  const ownershipMock: jest.Mocked<IOwnershipService> = {
    resolveOwnerId: jest.fn(),
    validateOwnership: jest.fn(),
    validateStrictOwnership: jest.fn(),
  };

  const transactionMock: jest.Mocked<ITransaction> = {
    execute: jest.fn().mockImplementation(async (callback) => {
      return callback({
        disciplineRepository: disciplineRepositoryMock,
        moduleRepository: moduleRepositoryMock,
      });
    }),
  };

  const adminAuthUser: AuthUserDTO = { id: "admin-id", role: "ADMIN", sessionId: "default" };
  const userAuthUser: AuthUserDTO = { id: "user-id", role: "USER", sessionId: "default" };

  const service = new DisciplineService(
    disciplineRepositoryMock,
    moduleRepositoryMock,
    sanitizeMock,
    ownershipMock,
    transactionMock,
  );

  beforeEach(() => {
    jest.clearAllMocks();
    sanitizeMock.sanitizeName.mockImplementation((value) => value.toUpperCase().trim());
  });


  describe("create", () => {

    it("should create a discipline successfully as the module owner", async () => {
      const course = makeCourse({ userId: userAuthUser.id });
      const module: ReturnType<typeof makeModule> & { course: { userId: string } } = {
        ...makeModule({ courseId: course.id }),
        course: { userId: course.userId },
      };
      const discipline = makeDiscipline({ moduleId: module.id });

      moduleRepositoryMock.findByIdWithCourse.mockResolvedValue(module);
      ownershipMock.validateOwnership.mockReturnValue(undefined);
      disciplineRepositoryMock.create.mockResolvedValue(discipline);

      const result = await service.create(userAuthUser, {
        moduleId: module.id,
        title: "discipline title  ",
        description: "desc",
      });

      expect(moduleRepositoryMock.findByIdWithCourse).toHaveBeenCalledTimes(1);
      expect(moduleRepositoryMock.findByIdWithCourse).toHaveBeenCalledWith(module.id);
      expect(ownershipMock.validateOwnership).toHaveBeenCalledTimes(1);
      expect(ownershipMock.validateOwnership).toHaveBeenCalledWith(userAuthUser, course.userId);
      expect(sanitizeMock.sanitizeName).toHaveBeenCalledTimes(1);
      expect(sanitizeMock.sanitizeName).toHaveBeenCalledWith("discipline title  ");
      expect(disciplineRepositoryMock.create).toHaveBeenCalledTimes(1);
      expect(disciplineRepositoryMock.create).toHaveBeenCalledWith({
        moduleId: module.id,
        title: "DISCIPLINE TITLE",
        description: "desc",
      });
      expect(result).not.toHaveProperty("deletedAt");
    });

    it("should allow ADMIN to create a discipline in another user's module", async () => {
      const course = makeCourse({ userId: userAuthUser.id });
      const module = { ...makeModule({ courseId: course.id }), course: { userId: course.userId } };
      const discipline = makeDiscipline({ moduleId: module.id });

      moduleRepositoryMock.findByIdWithCourse.mockResolvedValue(module);
      ownershipMock.validateOwnership.mockReturnValue(undefined);
      disciplineRepositoryMock.create.mockResolvedValue(discipline);

      await service.create(adminAuthUser, { moduleId: module.id, title: "title" });

      expect(ownershipMock.validateOwnership).toHaveBeenCalledWith(adminAuthUser, course.userId);
      expect(disciplineRepositoryMock.create).toHaveBeenCalledTimes(1);
    });

    it("should create a discipline with null description when not provided", async () => {
      const course = makeCourse({ userId: userAuthUser.id });
      const module = { ...makeModule({ courseId: course.id }), course: { userId: course.userId } };
      const discipline = makeDiscipline({ moduleId: module.id, description: null });

      moduleRepositoryMock.findByIdWithCourse.mockResolvedValue(module);
      ownershipMock.validateOwnership.mockReturnValue(undefined);
      disciplineRepositoryMock.create.mockResolvedValue(discipline);

      await service.create(userAuthUser, { moduleId: module.id, title: "title" });

      expect(disciplineRepositoryMock.create).toHaveBeenCalledWith(
        expect.objectContaining({ description: null })
      );
    });

    it("should throw NotFoundError when module does not exist", async () => {
      moduleRepositoryMock.findByIdWithCourse.mockResolvedValue(null);

      const promise = service.create(userAuthUser, { moduleId: "fake-id", title: "title" });

      await expect(promise).rejects.toBeInstanceOf(NotFoundError);
      await expect(promise).rejects.toThrow("Modulo não encontrado");
      expect(ownershipMock.validateOwnership).not.toHaveBeenCalled();
      expect(disciplineRepositoryMock.create).not.toHaveBeenCalled();
    });

    it("should throw AuthorizationError when USER tries to create a discipline in another user's module", async () => {
      const course = makeCourse({ userId: "other-id" });
      const module = { ...makeModule({ courseId: course.id }), course: { userId: course.userId } };

      moduleRepositoryMock.findByIdWithCourse.mockResolvedValue(module);
      ownershipMock.validateOwnership.mockImplementation(() => {
        throw new AuthorizationError("Ação não autorizada");
      });

      const promise = service.create(userAuthUser, { moduleId: module.id, title: "title" });

      await expect(promise).rejects.toBeInstanceOf(AuthorizationError);
      await expect(promise).rejects.toThrow("Ação não autorizada");
      expect(disciplineRepositoryMock.create).not.toHaveBeenCalled();
      expect(sanitizeMock.sanitizeName).not.toHaveBeenCalled();
    });

    it("should propagate moduleRepository findByIdWithCourse error", async () => {
      moduleRepositoryMock.findByIdWithCourse.mockRejectedValue(new Error("db error"));

      const promise = service.create(userAuthUser, { moduleId: "any", title: "title" });

      await expect(promise).rejects.toThrow("db error");
      expect(disciplineRepositoryMock.create).not.toHaveBeenCalled();
    });

    it("should propagate disciplineRepository create error", async () => {
      const course = makeCourse({ userId: userAuthUser.id });
      const module = { ...makeModule({ courseId: course.id }), course: { userId: course.userId } };

      moduleRepositoryMock.findByIdWithCourse.mockResolvedValue(module);
      ownershipMock.validateOwnership.mockReturnValue(undefined);
      disciplineRepositoryMock.create.mockRejectedValue(new Error("db error"));

      const promise = service.create(userAuthUser, { moduleId: module.id, title: "title" });

      await expect(promise).rejects.toThrow("db error");
      expect(disciplineRepositoryMock.create).toHaveBeenCalledTimes(1);
    });

  });


  describe("findById", () => {

    it("should find a discipline by id as ADMIN using findById", async () => {
      const discipline = makeDiscipline();

      disciplineRepositoryMock.findById.mockResolvedValue(discipline);

      const result = await service.findById(adminAuthUser, discipline.id);

      expect(disciplineRepositoryMock.findById).toHaveBeenCalledTimes(1);
      expect(disciplineRepositoryMock.findById).toHaveBeenCalledWith(discipline.id);
      expect(disciplineRepositoryMock.findByIdWithOwner).not.toHaveBeenCalled();
      expect(result).not.toHaveProperty("deletedAt");
    });

    it("should find a discipline by id as USER using findByIdWithOwner", async () => {
      const discipline = makeDiscipline();

      disciplineRepositoryMock.findByIdWithOwner.mockResolvedValue(discipline);

      const result = await service.findById(userAuthUser, discipline.id);

      expect(disciplineRepositoryMock.findByIdWithOwner).toHaveBeenCalledTimes(1);
      expect(disciplineRepositoryMock.findByIdWithOwner).toHaveBeenCalledWith(discipline.id, userAuthUser.id);
      expect(disciplineRepositoryMock.findById).not.toHaveBeenCalled();
      expect(result).not.toHaveProperty("deletedAt");
    });

    it("should return null when ADMIN discipline is not found", async () => {
      disciplineRepositoryMock.findById.mockResolvedValue(null);

      const result = await service.findById(adminAuthUser, "fake-id");

      expect(result).toBeNull();
      expect(disciplineRepositoryMock.findByIdWithOwner).not.toHaveBeenCalled();
    });

    it("should return null when USER discipline is not found", async () => {
      disciplineRepositoryMock.findByIdWithOwner.mockResolvedValue(null);

      const result = await service.findById(userAuthUser, "fake-id");

      expect(result).toBeNull();
      expect(disciplineRepositoryMock.findById).not.toHaveBeenCalled();
    });

    it("should propagate findById repository error for ADMIN", async () => {
      disciplineRepositoryMock.findById.mockRejectedValue(new Error("db error"));

      const promise = service.findById(adminAuthUser, "any-id");

      await expect(promise).rejects.toThrow("db error");
    });

    it("should propagate findByIdWithOwner repository error for USER", async () => {
      disciplineRepositoryMock.findByIdWithOwner.mockRejectedValue(new Error("db error"));

      const promise = service.findById(userAuthUser, "any-id");

      await expect(promise).rejects.toThrow("db error");
    });

  });


  describe("findAllByModuleId", () => {

    it("should return all disciplines for ADMIN using findAllByModuleId", async () => {
      const discipline1 = makeDiscipline();
      const discipline2 = makeDiscipline();

      disciplineRepositoryMock.findAllByModuleId.mockResolvedValue([discipline1, discipline2]);

      const result = await service.findAllByModuleId(adminAuthUser, "module-id");

      expect(disciplineRepositoryMock.findAllByModuleId).toHaveBeenCalledTimes(1);
      expect(disciplineRepositoryMock.findAllByModuleId).toHaveBeenCalledWith("module-id");
      expect(disciplineRepositoryMock.findAllByModuleIdWithOwner).not.toHaveBeenCalled();
      expect(result).toHaveLength(2);
      result.forEach((d) => expect(d).not.toHaveProperty("deletedAt"));
    });

    it("should return disciplines for USER using findAllByModuleIdWithOwner", async () => {
      const discipline1 = makeDiscipline();

      disciplineRepositoryMock.findAllByModuleIdWithOwner.mockResolvedValue([discipline1]);

      const result = await service.findAllByModuleId(userAuthUser, "module-id");

      expect(disciplineRepositoryMock.findAllByModuleIdWithOwner).toHaveBeenCalledTimes(1);
      expect(disciplineRepositoryMock.findAllByModuleIdWithOwner).toHaveBeenCalledWith("module-id", userAuthUser.id);
      expect(disciplineRepositoryMock.findAllByModuleId).not.toHaveBeenCalled();
      expect(result).toHaveLength(1);
    });

    it("should return empty array when no disciplines found for ADMIN", async () => {
      disciplineRepositoryMock.findAllByModuleId.mockResolvedValue([]);

      const result = await service.findAllByModuleId(adminAuthUser, "module-id");

      expect(result).toEqual([]);
    });

    it("should return empty array silently when USER has no access to module", async () => {
      disciplineRepositoryMock.findAllByModuleIdWithOwner.mockResolvedValue([]);

      const result = await service.findAllByModuleId(userAuthUser, "other-module-id");

      expect(result).toEqual([]);
      expect(disciplineRepositoryMock.findAllByModuleIdWithOwner).toHaveBeenCalledTimes(1);
    });

    it("should propagate findAllByModuleId repository error for ADMIN", async () => {
      disciplineRepositoryMock.findAllByModuleId.mockRejectedValue(new Error("db error"));

      const promise = service.findAllByModuleId(adminAuthUser, "any-id");

      await expect(promise).rejects.toThrow("db error");
    });

    it("should propagate findAllByModuleIdWithOwner repository error for USER", async () => {
      disciplineRepositoryMock.findAllByModuleIdWithOwner.mockRejectedValue(new Error("db error"));

      const promise = service.findAllByModuleId(userAuthUser, "any-id");

      await expect(promise).rejects.toThrow("db error");
    });

  });


  describe("findAllByUserId", () => {

    it("should return all disciplines for the authenticated user", async () => {
      const discipline1 = makeDiscipline();
      const discipline2 = makeDiscipline();

      ownershipMock.validateOwnership.mockReturnValue(undefined);
      disciplineRepositoryMock.findAllByUserId.mockResolvedValue([discipline1, discipline2]);

      const result = await service.findAllByUserId(userAuthUser, userAuthUser.id);

      expect(ownershipMock.validateOwnership).toHaveBeenCalledTimes(1);
      expect(ownershipMock.validateOwnership).toHaveBeenCalledWith(userAuthUser, userAuthUser.id);
      expect(disciplineRepositoryMock.findAllByUserId).toHaveBeenCalledTimes(1);
      expect(disciplineRepositoryMock.findAllByUserId).toHaveBeenCalledWith(userAuthUser.id);
      expect(result).toHaveLength(2);
      result.forEach((d) => expect(d).not.toHaveProperty("deletedAt"));
    });

    it("should allow ADMIN to access another user's disciplines", async () => {
      const discipline1 = makeDiscipline();

      ownershipMock.validateOwnership.mockReturnValue(undefined);
      disciplineRepositoryMock.findAllByUserId.mockResolvedValue([discipline1]);

      const result = await service.findAllByUserId(adminAuthUser, userAuthUser.id);

      expect(ownershipMock.validateOwnership).toHaveBeenCalledWith(adminAuthUser, userAuthUser.id);
      expect(disciplineRepositoryMock.findAllByUserId).toHaveBeenCalledWith(userAuthUser.id);
      expect(result).toHaveLength(1);
    });

    it("should return empty array when user has no disciplines", async () => {
      ownershipMock.validateOwnership.mockReturnValue(undefined);
      disciplineRepositoryMock.findAllByUserId.mockResolvedValue([]);

      const result = await service.findAllByUserId(userAuthUser, userAuthUser.id);

      expect(result).toEqual([]);
      expect(disciplineRepositoryMock.findAllByUserId).toHaveBeenCalledTimes(1);
    });

    it("should throw AuthorizationError when USER tries to access another user's disciplines", async () => {
      ownershipMock.validateOwnership.mockImplementation(() => {
        throw new AuthorizationError("Ação não autorizada");
      });

      const promise = service.findAllByUserId(userAuthUser, "other-id");

      await expect(promise).rejects.toBeInstanceOf(AuthorizationError);
      await expect(promise).rejects.toThrow("Ação não autorizada");
      expect(disciplineRepositoryMock.findAllByUserId).not.toHaveBeenCalled();
    });

    it("should propagate repository findAllByUserId error", async () => {
      ownershipMock.validateOwnership.mockReturnValue(undefined);
      disciplineRepositoryMock.findAllByUserId.mockRejectedValue(new Error("db error"));

      const promise = service.findAllByUserId(userAuthUser, userAuthUser.id);

      await expect(promise).rejects.toThrow("db error");
    });

  });


  describe("update", () => {

    it("should update a discipline title successfully as the module owner", async () => {
      const course = makeCourse({ userId: userAuthUser.id });
      const discipline: DisciplineWithCourseDTO = {
        ...makeDiscipline(),
        module: { course: { userId: course.userId } },
      };
      const updatedDiscipline = { ...discipline, title: "UPDATED TITLE" };

      disciplineRepositoryMock.findByIdWithCourse.mockResolvedValue(discipline);
      ownershipMock.validateOwnership.mockReturnValue(undefined);
      disciplineRepositoryMock.update.mockResolvedValue(updatedDiscipline);

      const result = await service.update(userAuthUser, discipline.id, { title: "updated title  " });

      expect(disciplineRepositoryMock.findByIdWithCourse).toHaveBeenCalledTimes(1);
      expect(disciplineRepositoryMock.findByIdWithCourse).toHaveBeenCalledWith(discipline.id);
      expect(ownershipMock.validateOwnership).toHaveBeenCalledTimes(1);
      expect(ownershipMock.validateOwnership).toHaveBeenCalledWith(userAuthUser, course.userId);
      expect(sanitizeMock.sanitizeName).toHaveBeenCalledTimes(1);
      expect(sanitizeMock.sanitizeName).toHaveBeenCalledWith("updated title  ");
      expect(disciplineRepositoryMock.update).toHaveBeenCalledTimes(1);
      expect(disciplineRepositoryMock.update).toHaveBeenCalledWith(discipline.id, {
        title: "UPDATED TITLE",
        description: discipline.description,
      });
      expect(result).not.toHaveProperty("deletedAt");
    });

    it("should update a discipline description successfully", async () => {
      const course = makeCourse({ userId: userAuthUser.id });
      const discipline: DisciplineWithCourseDTO = {
        ...makeDiscipline(),
        module: { course: { userId: course.userId } },
      };
      const updatedDiscipline = { ...discipline, description: "new description" };

      disciplineRepositoryMock.findByIdWithCourse.mockResolvedValue(discipline);
      ownershipMock.validateOwnership.mockReturnValue(undefined);
      disciplineRepositoryMock.update.mockResolvedValue(updatedDiscipline);

      await service.update(userAuthUser, discipline.id, { description: "new description" });

      expect(sanitizeMock.sanitizeName).not.toHaveBeenCalled();
      expect(disciplineRepositoryMock.update).toHaveBeenCalledWith(discipline.id, {
        title: discipline.title,
        description: "new description",
      });
    });

    it("should set description to null when explicitly passed as null", async () => {
      const course = makeCourse({ userId: userAuthUser.id });
      const discipline: DisciplineWithCourseDTO = {
        ...makeDiscipline({ description: "old desc" }),
        module: { course: { userId: course.userId } },
      };
      const updatedDiscipline = { ...discipline, description: null };

      disciplineRepositoryMock.findByIdWithCourse.mockResolvedValue(discipline);
      ownershipMock.validateOwnership.mockReturnValue(undefined);
      disciplineRepositoryMock.update.mockResolvedValue(updatedDiscipline);

      await service.update(userAuthUser, discipline.id, { description: null });

      expect(disciplineRepositoryMock.update).toHaveBeenCalledWith(discipline.id, {
        title: discipline.title,
        description: null,
      });
    });

    it("should allow ADMIN to update another user's discipline", async () => {
      const course = makeCourse({ userId: userAuthUser.id });
      const discipline: DisciplineWithCourseDTO = {
        ...makeDiscipline(),
        module: { course: { userId: course.userId } },
      };

      disciplineRepositoryMock.findByIdWithCourse.mockResolvedValue(discipline);
      ownershipMock.validateOwnership.mockReturnValue(undefined);
      disciplineRepositoryMock.update.mockResolvedValue(discipline);

      await service.update(adminAuthUser, discipline.id, { title: "admin update" });

      expect(ownershipMock.validateOwnership).toHaveBeenCalledWith(adminAuthUser, course.userId);
      expect(disciplineRepositoryMock.update).toHaveBeenCalledTimes(1);
    });

    it("should throw NotFoundError when discipline does not exist", async () => {
      disciplineRepositoryMock.findByIdWithCourse.mockResolvedValue(null);

      const promise = service.update(userAuthUser, "fake-id", { title: "title" });

      await expect(promise).rejects.toBeInstanceOf(NotFoundError);
      await expect(promise).rejects.toThrow("Disciplina não encontrada");
      expect(ownershipMock.validateOwnership).not.toHaveBeenCalled();
      expect(disciplineRepositoryMock.update).not.toHaveBeenCalled();
    });

    it("should throw AuthorizationError when USER tries to update another user's discipline", async () => {
      const discipline: DisciplineWithCourseDTO = {
        ...makeDiscipline(),
        module: { course: { userId: "other-id" } },
      };

      disciplineRepositoryMock.findByIdWithCourse.mockResolvedValue(discipline);
      ownershipMock.validateOwnership.mockImplementation(() => {
        throw new AuthorizationError("Ação não autorizada");
      });

      const promise = service.update(userAuthUser, discipline.id, { title: "hacker" });

      await expect(promise).rejects.toBeInstanceOf(AuthorizationError);
      await expect(promise).rejects.toThrow("Ação não autorizada");
      expect(disciplineRepositoryMock.update).not.toHaveBeenCalled();
      expect(sanitizeMock.sanitizeName).not.toHaveBeenCalled();
    });

    it("should propagate disciplineRepository findByIdWithCourse error", async () => {
      disciplineRepositoryMock.findByIdWithCourse.mockRejectedValue(new Error("db error"));

      const promise = service.update(userAuthUser, "any-id", { title: "title" });

      await expect(promise).rejects.toThrow("db error");
      expect(disciplineRepositoryMock.update).not.toHaveBeenCalled();
    });

    it("should propagate disciplineRepository update error", async () => {
      const discipline: DisciplineWithCourseDTO = {
        ...makeDiscipline(),
        module: { course: { userId: userAuthUser.id } },
      };

      disciplineRepositoryMock.findByIdWithCourse.mockResolvedValue(discipline);
      ownershipMock.validateOwnership.mockReturnValue(undefined);
      disciplineRepositoryMock.update.mockRejectedValue(new Error("db error"));

      const promise = service.update(userAuthUser, discipline.id, { title: "title" });

      await expect(promise).rejects.toThrow("db error");
      expect(disciplineRepositoryMock.update).toHaveBeenCalledTimes(1);
    });

  });


  describe("softDelete", () => {

    it("should soft delete a discipline inside a transaction as the owner", async () => {
      const discipline = makeDiscipline();

      disciplineRepositoryMock.findByIdWithOwner.mockResolvedValue(discipline);

      await service.softDelete(userAuthUser, discipline.id);

      expect(transactionMock.execute).toHaveBeenCalledTimes(1);
      expect(disciplineRepositoryMock.findByIdWithOwner).toHaveBeenCalledTimes(1);
      expect(disciplineRepositoryMock.findByIdWithOwner).toHaveBeenCalledWith(discipline.id, userAuthUser.id);
      expect(disciplineRepositoryMock.softDelete).toHaveBeenCalledTimes(1);
      expect(disciplineRepositoryMock.softDelete).toHaveBeenCalledWith(discipline.id);
    });

    it("should soft delete a discipline as ADMIN using findById", async () => {
      const discipline = makeDiscipline();

      disciplineRepositoryMock.findById.mockResolvedValue(discipline);

      await service.softDelete(adminAuthUser, discipline.id);

      expect(transactionMock.execute).toHaveBeenCalledTimes(1);
      expect(disciplineRepositoryMock.findById).toHaveBeenCalledTimes(1);
      expect(disciplineRepositoryMock.findById).toHaveBeenCalledWith(discipline.id);
      expect(disciplineRepositoryMock.findByIdWithOwner).not.toHaveBeenCalled();
      expect(disciplineRepositoryMock.softDelete).toHaveBeenCalledTimes(1);
      expect(disciplineRepositoryMock.softDelete).toHaveBeenCalledWith(discipline.id);
    });

    it("should return undefined idempotently when discipline does not exist as USER", async () => {
      disciplineRepositoryMock.findByIdWithOwner.mockResolvedValue(null);

      const result = await service.softDelete(userAuthUser, "fake-id");

      expect(result).toBeUndefined();
      expect(transactionMock.execute).toHaveBeenCalledTimes(1);
      expect(disciplineRepositoryMock.softDelete).not.toHaveBeenCalled();
    });

    it("should return undefined idempotently when discipline does not exist as ADMIN", async () => {
      disciplineRepositoryMock.findById.mockResolvedValue(null);

      const result = await service.softDelete(adminAuthUser, "fake-id");

      expect(result).toBeUndefined();
      expect(transactionMock.execute).toHaveBeenCalledTimes(1);
      expect(disciplineRepositoryMock.softDelete).not.toHaveBeenCalled();
    });

    it("should propagate findByIdWithOwner error for USER", async () => {
      disciplineRepositoryMock.findByIdWithOwner.mockRejectedValue(new Error("db error"));

      const promise = service.softDelete(userAuthUser, "any-id");

      await expect(promise).rejects.toThrow("db error");
      expect(disciplineRepositoryMock.softDelete).not.toHaveBeenCalled();
    });

    it("should propagate findById error for ADMIN", async () => {
      disciplineRepositoryMock.findById.mockRejectedValue(new Error("db error"));

      const promise = service.softDelete(adminAuthUser, "any-id");

      await expect(promise).rejects.toThrow("db error");
      expect(disciplineRepositoryMock.softDelete).not.toHaveBeenCalled();
    });

    it("should propagate softDelete repository error", async () => {
      const discipline = makeDiscipline();

      disciplineRepositoryMock.findByIdWithOwner.mockResolvedValue(discipline);
      disciplineRepositoryMock.softDelete.mockRejectedValue(new Error("db error"));

      const promise = service.softDelete(userAuthUser, discipline.id);

      await expect(promise).rejects.toThrow("db error");
      expect(disciplineRepositoryMock.softDelete).toHaveBeenCalledTimes(1);
    });

  });

});