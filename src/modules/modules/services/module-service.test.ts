import { AuthorizationError } from "../../../shared/errors/authorization.error";
import { NotFoundError } from "../../../shared/errors/not-found-error";
import type { IOwnershipService } from "../../../shared/ownership/ownership-service.interface";
import type { Isanitize } from "../../../shared/sanitize/interfaces/sanitize.interface";
import type { AuthUserDTO } from "../../../shared/DTOs/auth-user.DTO";
import type { ICourseRepository } from "../../courses/interfaces/repositories/course-repository.interface";
import type { IModuleRepository } from "../interfaces/repositories/module-repository.interface";
import type { ITransaction } from "../../transaction/interfaces/transaction.interface";
import { ModuleService } from "./module.service";
import { makeModule } from "../../../tests/factories/make-module";
import { makeCourse } from "../../../tests/factories/make-course";
import type { IDisciplineRepository } from "../../disciplines/interfaces/repositories/discipline-repository.interface";
import type { ModuleWithCourseDTO } from "../DTOs/module-with-course.DTO";

describe("ModuleService", () => {

  const moduleRepositoryMock: jest.Mocked<IModuleRepository> = {
    findById: jest.fn(),
    findAllByCourseId: jest.fn(),
    findAllByCourseIdWithOwner: jest.fn(),
    findByIdWithOwner: jest.fn(),
    findAllByUserId: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    softDelete: jest.fn(),
    softDeleteAllByCourseIds: jest.fn(),
    findByIdWithCourse: jest.fn()
  };

  const courseRepositoryMock: jest.Mocked<ICourseRepository> = {
    create: jest.fn(),
    findById: jest.fn(),
    findOwnedById: jest.fn(),
    findAllByUserId: jest.fn(),
    update: jest.fn(),
    softDelete: jest.fn(),
    softDeleteAllByUserId: jest.fn(),
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
  }

  const goalRepositoryMock = {
    deleteAllByModuleIds: jest.fn(),
    deleteAllByCourseIds: jest.fn(),
    deleteAllByDisciplineIds: jest.fn(),
  }


  const transactionMock: jest.Mocked<ITransaction> = {
    execute: jest.fn().mockImplementation(async (callback) => {
      return callback({
        moduleRepository: moduleRepositoryMock,
        courseRepository: courseRepositoryMock,
        disciplineRepository: disciplineRepositoryMock,
        goalRepository: goalRepositoryMock
      });
    }),
  };

  const adminAuthUser: AuthUserDTO = { id: "admin-id", role: "ADMIN", sessionId: "default" };
  const userAuthUser: AuthUserDTO = { id: "user-id", role: "USER", sessionId: "default" };

  const service = new ModuleService(
    moduleRepositoryMock,
    courseRepositoryMock,
    sanitizeMock,
    ownershipMock,
    transactionMock,
  );

  beforeEach(() => {
    jest.clearAllMocks();
    sanitizeMock.sanitizeName.mockImplementation((value) => value.toUpperCase().trim());
  });


  describe("create", () => {

    it("should create a module successfully as the course owner", async () => {
      const course = makeCourse({ userId: userAuthUser.id });
      const module = makeModule({ courseId: course.id });

      courseRepositoryMock.findById.mockResolvedValue(course);
      ownershipMock.validateOwnership.mockReturnValue(undefined);
      moduleRepositoryMock.create.mockResolvedValue(module);

      const result = await service.create(userAuthUser, {
        courseId: course.id,
        title: "module title  ",
        description: "desc",
      });

      expect(courseRepositoryMock.findById).toHaveBeenCalledTimes(1);
      expect(courseRepositoryMock.findById).toHaveBeenCalledWith(course.id);
      expect(ownershipMock.validateOwnership).toHaveBeenCalledTimes(1);
      expect(ownershipMock.validateOwnership).toHaveBeenCalledWith(userAuthUser, course.userId);
      expect(sanitizeMock.sanitizeName).toHaveBeenCalledTimes(1);
      expect(sanitizeMock.sanitizeName).toHaveBeenCalledWith("module title  ");
      expect(moduleRepositoryMock.create).toHaveBeenCalledTimes(1);
      expect(moduleRepositoryMock.create).toHaveBeenCalledWith({
        courseId: course.id,
        title: "MODULE TITLE",
        description: "desc",
      });
      expect(result).not.toHaveProperty("deletedAt");
    });

    it("should allow ADMIN to create a module in another user's course", async () => {
      const course = makeCourse({ userId: userAuthUser.id });
      const module = makeModule({ courseId: course.id });

      courseRepositoryMock.findById.mockResolvedValue(course);
      ownershipMock.validateOwnership.mockReturnValue(undefined);
      moduleRepositoryMock.create.mockResolvedValue(module);

      await service.create(adminAuthUser, { courseId: course.id, title: "title" });

      expect(ownershipMock.validateOwnership).toHaveBeenCalledWith(adminAuthUser, course.userId);
      expect(moduleRepositoryMock.create).toHaveBeenCalledTimes(1);
    });

    it("should create a module with null description when not provided", async () => {
      const course = makeCourse({ userId: userAuthUser.id });
      const module = makeModule({ courseId: course.id, description: null });

      courseRepositoryMock.findById.mockResolvedValue(course);
      ownershipMock.validateOwnership.mockReturnValue(undefined);
      moduleRepositoryMock.create.mockResolvedValue(module);

      await service.create(userAuthUser, { courseId: course.id, title: "title" });

      expect(moduleRepositoryMock.create).toHaveBeenCalledWith(
        expect.objectContaining({ description: null })
      );
    });

    it("should throw NotFoundError when course does not exist", async () => {
      courseRepositoryMock.findById.mockResolvedValue(null);

      const promise = service.create(userAuthUser, { courseId: "fake-id", title: "title" });

      await expect(promise).rejects.toBeInstanceOf(NotFoundError);
      await expect(promise).rejects.toThrow("Curso não encontrado");
      expect(ownershipMock.validateOwnership).not.toHaveBeenCalled();
      expect(moduleRepositoryMock.create).not.toHaveBeenCalled();
    });

    it("should throw AuthorizationError when USER tries to create a module in another user's course", async () => {
      const course = makeCourse({ userId: "other-id" });

      courseRepositoryMock.findById.mockResolvedValue(course);
      ownershipMock.validateOwnership.mockImplementation(() => {
        throw new AuthorizationError("Ação não autorizada");
      });

      const promise = service.create(userAuthUser, { courseId: course.id, title: "title" });

      await expect(promise).rejects.toBeInstanceOf(AuthorizationError);
      await expect(promise).rejects.toThrow("Ação não autorizada");
      expect(moduleRepositoryMock.create).not.toHaveBeenCalled();
      expect(sanitizeMock.sanitizeName).not.toHaveBeenCalled();
    });

    it("should propagate courseRepository findById error", async () => {
      courseRepositoryMock.findById.mockRejectedValue(new Error("db error"));

      const promise = service.create(userAuthUser, { courseId: "any", title: "title" });

      await expect(promise).rejects.toThrow("db error");
      expect(moduleRepositoryMock.create).not.toHaveBeenCalled();
    });

    it("should propagate moduleRepository create error", async () => {
      const course = makeCourse({ userId: userAuthUser.id });

      courseRepositoryMock.findById.mockResolvedValue(course);
      ownershipMock.validateOwnership.mockReturnValue(undefined);
      moduleRepositoryMock.create.mockRejectedValue(new Error("db error"));

      const promise = service.create(userAuthUser, { courseId: course.id, title: "title" });

      await expect(promise).rejects.toThrow("db error");
      expect(moduleRepositoryMock.create).toHaveBeenCalledTimes(1);
    });

  });


  describe("findById", () => {

    it("should find a module by id as ADMIN using findById", async () => {
      const module = makeModule();

      moduleRepositoryMock.findById.mockResolvedValue(module);

      const result = await service.findById(adminAuthUser, module.id);

      expect(moduleRepositoryMock.findById).toHaveBeenCalledTimes(1);
      expect(moduleRepositoryMock.findById).toHaveBeenCalledWith(module.id);
      expect(moduleRepositoryMock.findByIdWithOwner).not.toHaveBeenCalled();
      expect(result).not.toHaveProperty("deletedAt");
    });

    it("should find a module by id as USER using findByIdWithOwner", async () => {
      const module = makeModule();

      moduleRepositoryMock.findByIdWithOwner.mockResolvedValue(module);

      const result = await service.findById(userAuthUser, module.id);

      expect(moduleRepositoryMock.findByIdWithOwner).toHaveBeenCalledTimes(1);
      expect(moduleRepositoryMock.findByIdWithOwner).toHaveBeenCalledWith(module.id, userAuthUser.id);
      expect(moduleRepositoryMock.findById).not.toHaveBeenCalled();
      expect(result).not.toHaveProperty("deletedAt");
    });

    it("should return null when ADMIN module is not found", async () => {
      moduleRepositoryMock.findById.mockResolvedValue(null);

      const result = await service.findById(adminAuthUser, "fake-id");

      expect(result).toBeNull();
      expect(moduleRepositoryMock.findByIdWithOwner).not.toHaveBeenCalled();
    });

    it("should return null when USER module is not found", async () => {
      moduleRepositoryMock.findByIdWithOwner.mockResolvedValue(null);

      const result = await service.findById(userAuthUser, "fake-id");

      expect(result).toBeNull();
      expect(moduleRepositoryMock.findById).not.toHaveBeenCalled();
    });

    it("should propagate findById repository error for ADMIN", async () => {
      moduleRepositoryMock.findById.mockRejectedValue(new Error("db error"));

      const promise = service.findById(adminAuthUser, "any-id");

      await expect(promise).rejects.toThrow("db error");
    });

    it("should propagate findByIdWithOwner repository error for USER", async () => {
      moduleRepositoryMock.findByIdWithOwner.mockRejectedValue(new Error("db error"));

      const promise = service.findById(userAuthUser, "any-id");

      await expect(promise).rejects.toThrow("db error");
    });

  });


  describe("findAllByCourseId", () => {

    it("should return all modules for ADMIN using findAllByCourseId", async () => {
      const module1 = makeModule();
      const module2 = makeModule();

      moduleRepositoryMock.findAllByCourseId.mockResolvedValue([module1, module2]);

      const result = await service.findAllByCourseId(adminAuthUser, "course-id");

      expect(moduleRepositoryMock.findAllByCourseId).toHaveBeenCalledTimes(1);
      expect(moduleRepositoryMock.findAllByCourseId).toHaveBeenCalledWith("course-id");
      expect(moduleRepositoryMock.findAllByCourseIdWithOwner).not.toHaveBeenCalled();
      expect(result).toHaveLength(2);
      result.forEach((m) => expect(m).not.toHaveProperty("deletedAt"));
    });

    it("should return modules for USER using findAllByCourseIdWithOwner", async () => {
      const module1 = makeModule();

      moduleRepositoryMock.findAllByCourseIdWithOwner.mockResolvedValue([module1]);

      const result = await service.findAllByCourseId(userAuthUser, "course-id");

      expect(moduleRepositoryMock.findAllByCourseIdWithOwner).toHaveBeenCalledTimes(1);
      expect(moduleRepositoryMock.findAllByCourseIdWithOwner).toHaveBeenCalledWith("course-id", userAuthUser.id);
      expect(moduleRepositoryMock.findAllByCourseId).not.toHaveBeenCalled();
      expect(result).toHaveLength(1);
    });

    it("should return empty array when no modules found for ADMIN", async () => {
      moduleRepositoryMock.findAllByCourseId.mockResolvedValue([]);

      const result = await service.findAllByCourseId(adminAuthUser, "course-id");

      expect(result).toEqual([]);
    });

    it("should return empty array silently when USER has no access to course", async () => {
      moduleRepositoryMock.findAllByCourseIdWithOwner.mockResolvedValue([]);

      const result = await service.findAllByCourseId(userAuthUser, "other-course-id");

      expect(result).toEqual([]);
      expect(moduleRepositoryMock.findAllByCourseIdWithOwner).toHaveBeenCalledTimes(1);
    });

    it("should propagate findAllByCourseId repository error for ADMIN", async () => {
      moduleRepositoryMock.findAllByCourseId.mockRejectedValue(new Error("db error"));

      const promise = service.findAllByCourseId(adminAuthUser, "any-id");

      await expect(promise).rejects.toThrow("db error");
    });

    it("should propagate findAllByCourseIdWithOwner repository error for USER", async () => {
      moduleRepositoryMock.findAllByCourseIdWithOwner.mockRejectedValue(new Error("db error"));

      const promise = service.findAllByCourseId(userAuthUser, "any-id");

      await expect(promise).rejects.toThrow("db error");
    });

  });


  describe("findAllByUserId", () => {

    it("should return all modules for the authenticated user", async () => {
      const module1 = makeModule();
      const module2 = makeModule();

      ownershipMock.validateOwnership.mockReturnValue(undefined);
      moduleRepositoryMock.findAllByUserId.mockResolvedValue([module1, module2]);

      const result = await service.findAllByUserId(userAuthUser, userAuthUser.id);

      expect(ownershipMock.validateOwnership).toHaveBeenCalledTimes(1);
      expect(ownershipMock.validateOwnership).toHaveBeenCalledWith(userAuthUser, userAuthUser.id);
      expect(moduleRepositoryMock.findAllByUserId).toHaveBeenCalledTimes(1);
      expect(moduleRepositoryMock.findAllByUserId).toHaveBeenCalledWith(userAuthUser.id);
      expect(result).toHaveLength(2);
      result.forEach((m) => expect(m).not.toHaveProperty("deletedAt"));
    });

    it("should allow ADMIN to access another user's modules", async () => {
      const module1 = makeModule();

      ownershipMock.validateOwnership.mockReturnValue(undefined);
      moduleRepositoryMock.findAllByUserId.mockResolvedValue([module1]);

      const result = await service.findAllByUserId(adminAuthUser, userAuthUser.id);

      expect(ownershipMock.validateOwnership).toHaveBeenCalledWith(adminAuthUser, userAuthUser.id);
      expect(moduleRepositoryMock.findAllByUserId).toHaveBeenCalledWith(userAuthUser.id);
      expect(result).toHaveLength(1);
    });

    it("should return empty array when user has no modules", async () => {
      ownershipMock.validateOwnership.mockReturnValue(undefined);
      moduleRepositoryMock.findAllByUserId.mockResolvedValue([]);

      const result = await service.findAllByUserId(userAuthUser, userAuthUser.id);

      expect(result).toEqual([]);
      expect(moduleRepositoryMock.findAllByUserId).toHaveBeenCalledTimes(1);
    });

    it("should throw AuthorizationError when USER tries to access another user's modules", async () => {
      ownershipMock.validateOwnership.mockImplementation(() => {
        throw new AuthorizationError("Ação não autorizada");
      });

      const promise = service.findAllByUserId(userAuthUser, "other-id");

      await expect(promise).rejects.toBeInstanceOf(AuthorizationError);
      await expect(promise).rejects.toThrow("Ação não autorizada");
      expect(moduleRepositoryMock.findAllByUserId).not.toHaveBeenCalled();
    });

    it("should propagate repository findAllByUserId error", async () => {
      ownershipMock.validateOwnership.mockReturnValue(undefined);
      moduleRepositoryMock.findAllByUserId.mockRejectedValue(new Error("db error"));

      const promise = service.findAllByUserId(userAuthUser, userAuthUser.id);

      await expect(promise).rejects.toThrow("db error");
    });

  });


  describe("update", () => {

    it("should update a module title successfully as the course owner", async () => {
      const course = makeCourse({ userId: userAuthUser.id });
      const module: ModuleWithCourseDTO = {
        ...makeModule({ courseId: course.id }),
        course: {
          userId: course.userId
        }
      };
      const updatedModule = { ...module, title: "UPDATED TITLE" };

      moduleRepositoryMock.findByIdWithCourse.mockResolvedValue(module);
      ownershipMock.validateOwnership.mockReturnValue(undefined);
      moduleRepositoryMock.update.mockResolvedValue(updatedModule);

      const result = await service.update(userAuthUser, module.id, { title: "updated title  " });

      expect(moduleRepositoryMock.findByIdWithCourse).toHaveBeenCalledTimes(1);
      expect(moduleRepositoryMock.findByIdWithCourse).toHaveBeenCalledWith(module.id);
      expect(ownershipMock.validateOwnership).toHaveBeenCalledTimes(1);
      expect(ownershipMock.validateOwnership).toHaveBeenCalledWith(userAuthUser, course.userId);
      expect(sanitizeMock.sanitizeName).toHaveBeenCalledTimes(1);
      expect(sanitizeMock.sanitizeName).toHaveBeenCalledWith("updated title  ");
      expect(moduleRepositoryMock.update).toHaveBeenCalledTimes(1);
      expect(moduleRepositoryMock.update).toHaveBeenCalledWith(module.id, {
        title: "UPDATED TITLE",
        description: module.description,
      });
      expect(result).not.toHaveProperty("deletedAt");
    });

    it("should update a module description successfully", async () => {
      const course = makeCourse({ userId: userAuthUser.id });
      const module: ModuleWithCourseDTO = {
        ...makeModule({ courseId: course.id }),
        course: {
          userId: course.userId
        }
      };
      const updatedModule = { ...module, description: "new description" };

      moduleRepositoryMock.findByIdWithCourse.mockResolvedValue(module);
      ownershipMock.validateOwnership.mockReturnValue(undefined);
      moduleRepositoryMock.update.mockResolvedValue(updatedModule);

      await service.update(userAuthUser, module.id, { description: "new description" });

      expect(sanitizeMock.sanitizeName).not.toHaveBeenCalled();
      expect(moduleRepositoryMock.update).toHaveBeenCalledWith(module.id, {
        title: module.title,
        description: "new description",
      });
    });

    it("should set description to null when explicitly passed as null", async () => {
      const course = makeCourse({ userId: userAuthUser.id });
      const module: ModuleWithCourseDTO = {
        ...makeModule({ courseId: course.id }),
        course: {
          userId: course.userId
        }
      };
      const updatedModule = { ...module, description: null };

      moduleRepositoryMock.findByIdWithCourse.mockResolvedValue(module);
      ownershipMock.validateOwnership.mockReturnValue(undefined);
      moduleRepositoryMock.update.mockResolvedValue(updatedModule);

      await service.update(userAuthUser, module.id, { description: null });

      expect(moduleRepositoryMock.update).toHaveBeenCalledWith(module.id, {
        title: module.title,
        description: null,
      });
    });

    it("should allow ADMIN to update another user's module", async () => {
      const course = makeCourse({ userId: userAuthUser.id });
      const module: ModuleWithCourseDTO = {
        ...makeModule({ courseId: course.id }),
        course: {
          userId: course.userId
        }
      };
      moduleRepositoryMock.findByIdWithCourse.mockResolvedValue(module);
      ownershipMock.validateOwnership.mockReturnValue(undefined);
      moduleRepositoryMock.update.mockResolvedValue(module);

      await service.update(adminAuthUser, module.id, { title: "admin update" });

      expect(ownershipMock.validateOwnership).toHaveBeenCalledWith(adminAuthUser, course.userId);
      expect(moduleRepositoryMock.update).toHaveBeenCalledTimes(1);
    });

    it("should throw NotFoundError when module does not exist", async () => {
      moduleRepositoryMock.findByIdWithCourse.mockResolvedValue(null);

      const promise = service.update(userAuthUser, "fake-id", { title: "title" });

      await expect(promise).rejects.toBeInstanceOf(NotFoundError);
      await expect(promise).rejects.toThrow("Módulo não encontrado");
      expect(ownershipMock.validateOwnership).not.toHaveBeenCalled();
      expect(moduleRepositoryMock.update).not.toHaveBeenCalled();
    });

    it("should throw AuthorizationError when USER tries to update another user's module", async () => {
      const course = makeCourse({ userId: "other-id" });
      const module: ModuleWithCourseDTO = {
        ...makeModule({ courseId: course.id }),
        course: {
          userId: course.userId
        }
      }

      moduleRepositoryMock.findByIdWithCourse.mockResolvedValue(module);
      ownershipMock.validateOwnership.mockImplementation(() => {
        throw new AuthorizationError("Ação não autorizada");
      });

      const promise = service.update(userAuthUser, module.id, { title: "hacker" });

      await expect(promise).rejects.toBeInstanceOf(AuthorizationError);
      await expect(promise).rejects.toThrow("Ação não autorizada");
      expect(moduleRepositoryMock.update).not.toHaveBeenCalled();
      expect(sanitizeMock.sanitizeName).not.toHaveBeenCalled();
    });

    it("should propagate moduleRepository findByIdWithCourse error", async () => {
      moduleRepositoryMock.findByIdWithCourse.mockRejectedValue(new Error("db error"));

      const promise = service.update(userAuthUser, "any-id", { title: "title" });

      await expect(promise).rejects.toThrow("db error");
      expect(moduleRepositoryMock.update).not.toHaveBeenCalled();
    });


    it("should propagate moduleRepository update error", async () => {
      const course = makeCourse({ userId: userAuthUser.id });
      const module: ModuleWithCourseDTO = {
        ...makeModule({ courseId: course.id }),
        course: {
          userId: course.userId
        }
      };
      moduleRepositoryMock.findByIdWithCourse.mockResolvedValue(module);
      ownershipMock.validateOwnership.mockReturnValue(undefined);
      moduleRepositoryMock.update.mockRejectedValue(new Error("db error"));

      const promise = service.update(userAuthUser, module.id, { title: "title" });

      await expect(promise).rejects.toThrow("db error");
      expect(moduleRepositoryMock.update).toHaveBeenCalledTimes(1);
    });

  });


  describe("softDelete", () => {

    it("should soft delete a module inside a transaction as the owner", async () => {
      const module = makeModule();

      moduleRepositoryMock.findByIdWithOwner.mockResolvedValue(module);

      await service.softDelete(userAuthUser, module.id);

      expect(transactionMock.execute).toHaveBeenCalledTimes(1);
      expect(moduleRepositoryMock.findByIdWithOwner).toHaveBeenCalledTimes(1);
      expect(moduleRepositoryMock.findByIdWithOwner).toHaveBeenCalledWith(module.id, userAuthUser.id);
      expect(disciplineRepositoryMock.softDeleteAllByModuleIds).toHaveBeenCalledTimes(1);
      expect(disciplineRepositoryMock.softDeleteAllByModuleIds).toHaveBeenCalledWith([module.id]);
      expect(moduleRepositoryMock.softDelete).toHaveBeenCalledTimes(1);
      expect(moduleRepositoryMock.softDelete).toHaveBeenCalledWith(module.id);
      expect(goalRepositoryMock.deleteAllByModuleIds).toHaveBeenCalledTimes(1);
      expect(goalRepositoryMock.deleteAllByModuleIds).toHaveBeenCalledWith([module.id]);
    });

    it("should soft delete a module as ADMIN using findById", async () => {
      const module = makeModule();

      moduleRepositoryMock.findById.mockResolvedValue(module);

      await service.softDelete(adminAuthUser, module.id);

      expect(transactionMock.execute).toHaveBeenCalledTimes(1);
      expect(moduleRepositoryMock.findById).toHaveBeenCalledTimes(1);
      expect(moduleRepositoryMock.findById).toHaveBeenCalledWith(module.id);
      expect(moduleRepositoryMock.findByIdWithOwner).not.toHaveBeenCalled();
      expect(disciplineRepositoryMock.softDeleteAllByModuleIds).toHaveBeenCalledTimes(1);
      expect(disciplineRepositoryMock.softDeleteAllByModuleIds).toHaveBeenCalledWith([module.id]);
      expect(moduleRepositoryMock.softDelete).toHaveBeenCalledTimes(1);
      expect(moduleRepositoryMock.softDelete).toHaveBeenCalledWith(module.id);
      expect(goalRepositoryMock.deleteAllByModuleIds).toHaveBeenCalledTimes(1);
      expect(goalRepositoryMock.deleteAllByModuleIds).toHaveBeenCalledWith([module.id]);
    });

    it("should return undefined idempotently when module does not exist as USER", async () => {
      moduleRepositoryMock.findByIdWithOwner.mockResolvedValue(null);

      const result = await service.softDelete(userAuthUser, "fake-id");

      expect(result).toBeUndefined();
      expect(transactionMock.execute).toHaveBeenCalledTimes(1);
      expect(disciplineRepositoryMock.softDeleteAllByModuleIds).not.toHaveBeenCalled();
      expect(goalRepositoryMock.deleteAllByModuleIds).not.toHaveBeenCalled();
      expect(moduleRepositoryMock.softDelete).not.toHaveBeenCalled();
    });

    it("should return undefined idempotently when module does not exist as ADMIN", async () => {
      moduleRepositoryMock.findById.mockResolvedValue(null);

      const result = await service.softDelete(adminAuthUser, "fake-id");

      expect(result).toBeUndefined();
      expect(transactionMock.execute).toHaveBeenCalledTimes(1);
      expect(disciplineRepositoryMock.softDeleteAllByModuleIds).not.toHaveBeenCalled();
      expect(goalRepositoryMock.deleteAllByModuleIds).not.toHaveBeenCalled();
      expect(moduleRepositoryMock.softDelete).not.toHaveBeenCalled();
    });

    it("should propagate findByIdWithOwner error for USER", async () => {
      moduleRepositoryMock.findByIdWithOwner.mockRejectedValue(new Error("db error"));

      const promise = service.softDelete(userAuthUser, "any-id");

      await expect(promise).rejects.toThrow("db error");
      expect(disciplineRepositoryMock.softDeleteAllByModuleIds).not.toHaveBeenCalled();
      expect(moduleRepositoryMock.softDelete).not.toHaveBeenCalled();
      expect(goalRepositoryMock.deleteAllByModuleIds).not.toHaveBeenCalled();
    });

    it("should propagate findById error for ADMIN", async () => {
      moduleRepositoryMock.findById.mockRejectedValue(new Error("db error"));

      const promise = service.softDelete(adminAuthUser, "any-id");

      await expect(promise).rejects.toThrow("db error");
      expect(disciplineRepositoryMock.softDeleteAllByModuleIds).not.toHaveBeenCalled();
      expect(moduleRepositoryMock.softDelete).not.toHaveBeenCalled();
      expect(goalRepositoryMock.deleteAllByModuleIds).not.toHaveBeenCalled();
    });

    it("should propagate softDelete repository error", async () => {
      const module = makeModule();

      moduleRepositoryMock.findByIdWithOwner.mockResolvedValue(module);
      moduleRepositoryMock.softDelete.mockRejectedValue(new Error("db error"));

      const promise = service.softDelete(userAuthUser, module.id);

      await expect(promise).rejects.toThrow("db error");
      expect(disciplineRepositoryMock.softDeleteAllByModuleIds).toHaveBeenCalledTimes(1);
      expect(disciplineRepositoryMock.softDeleteAllByModuleIds).toHaveBeenCalledWith([module.id]);
      expect(goalRepositoryMock.deleteAllByModuleIds).toHaveBeenCalledTimes(1);
      expect(goalRepositoryMock.deleteAllByModuleIds).toHaveBeenCalledWith([module.id]); expect(moduleRepositoryMock.softDelete).toHaveBeenCalledTimes(1);
    });

    it("should propagate softDeleteAllByModuleIds discipline repository error", async () => {
      const module = makeModule();

      moduleRepositoryMock.findByIdWithOwner.mockResolvedValue(module);
      disciplineRepositoryMock.softDeleteAllByModuleIds.mockRejectedValue(new Error("softDeleteAllByModuleIds error"));

      const promise = service.softDelete(userAuthUser, module.id);

      await expect(promise).rejects.toThrow("softDeleteAllByModuleIds error");
      expect(disciplineRepositoryMock.softDeleteAllByModuleIds).toHaveBeenCalledTimes(1);
      expect(disciplineRepositoryMock.softDeleteAllByModuleIds).toHaveBeenCalledWith([module.id]);
      expect(moduleRepositoryMock.softDelete).not.toHaveBeenCalled()
      expect(goalRepositoryMock.deleteAllByModuleIds).not.toHaveBeenCalled();
    });

  });

});