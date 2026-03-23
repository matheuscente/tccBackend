import { AuthorizationError } from "../../../shared/errors/authorization.error";
import { NotFoundError } from "../../../shared/errors/not-found-error";
import type { IOwnershipService } from "../../../shared/ownership/ownership-service.interface";
import type { Isanitize } from "../../../shared/sanitize/interfaces/sanitize.interface";
import { makeCourse } from "../../../tests/factories/make-course";
import type { IModuleRepository } from "../../modules/interfaces/repositories/module-repository.interface";
import type { ITransaction } from "../../transaction/interfaces/transaction.interface";
import type { AuthUserDTO } from "../../../shared/DTOs/auth-user.DTO";
import type { ICourseRepository } from "../interfaces/repositories/course-repository.interface";
import { CourseService } from "./course.service";

describe("CourseService", () => {

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

  const ownershipMock: jest.Mocked<IOwnershipService> = {
    resolveOwnerId: jest.fn(),
    validateOwnership: jest.fn(),
    validateStrictOwnership: jest.fn(),
  };

  const goalRepositoryMock = {
    deleteAllByCourseIds: jest.fn()

  }

  const studySessionRepositoryMock = {
    deleteAllByCourseIds: jest.fn()

  }


  const transactionMock: jest.Mocked<ITransaction> = {
    execute: jest.fn().mockImplementation(async (callback) => {
      return callback({
        moduleRepository: moduleRepositoryMock,
        courseRepository: courseRepositoryMock,
        goalRepository: goalRepositoryMock,
        studySessionRepository: studySessionRepositoryMock
      });
    }),
  };

  const adminAuthUser: AuthUserDTO = { id: "admin-id", role: "ADMIN", sessionId: "default" };
  const userAuthUser: AuthUserDTO = { id: "user-id", role: "USER", sessionId: "default" };

  const service = new CourseService(
    courseRepositoryMock,
    sanitizeMock,
    transactionMock,
    ownershipMock
  );

  beforeEach(() => {
    jest.clearAllMocks();
    sanitizeMock.sanitizeName.mockImplementation((value) => value.toUpperCase().trim());
    sanitizeMock.sanitizeUsername.mockImplementation((value) => value.toLowerCase().trim());
  });


  describe("create", () => {

    it("should create a course for the authenticated user without specifying userId", async () => {
      const course = makeCourse({ userId: userAuthUser.id });

      ownershipMock.resolveOwnerId.mockResolvedValue(userAuthUser.id);
      courseRepositoryMock.create.mockResolvedValue(course);

      const result = await service.create(userAuthUser, { title: "test    ", description: "test" });

      expect(ownershipMock.resolveOwnerId).toHaveBeenCalledWith(userAuthUser, undefined);
      expect(courseRepositoryMock.create).toHaveBeenCalledWith({
        userId: userAuthUser.id,
        title: "TEST",
        description: "test",
      });
      expect(sanitizeMock.sanitizeName).toHaveBeenCalledWith("test    ");
      expect(result).not.toHaveProperty("deletedAt");
      expect(result).not.toHaveProperty("userId");
    });

    it("should create a course for the authenticated user specifying their own userId", async () => {
      const course = makeCourse({ userId: userAuthUser.id });

      ownershipMock.resolveOwnerId.mockResolvedValue(userAuthUser.id);
      courseRepositoryMock.create.mockResolvedValue(course);

      await service.create(userAuthUser, { userId: userAuthUser.id, title: "test", description: "test" });

      expect(ownershipMock.resolveOwnerId).toHaveBeenCalledWith(userAuthUser, userAuthUser.id);
      expect(courseRepositoryMock.create).toHaveBeenCalledWith({
        userId: userAuthUser.id,
        title: "TEST",
        description: "test",
      });
    });

    it("should allow admin to create a course for another user", async () => {
      const course = makeCourse({ userId: userAuthUser.id });

      ownershipMock.resolveOwnerId.mockResolvedValue(userAuthUser.id);
      courseRepositoryMock.create.mockResolvedValue(course);

      await service.create(adminAuthUser, { userId: userAuthUser.id, title: "test", description: "test" });

      expect(ownershipMock.resolveOwnerId).toHaveBeenCalledWith(adminAuthUser, userAuthUser.id);
      expect(courseRepositoryMock.create).toHaveBeenCalledWith({
        userId: userAuthUser.id,
        title: "TEST",
        description: "test",
      });
    });

    it("should allow admin to create a course for themselves without specifying userId", async () => {
      const course = makeCourse({ userId: adminAuthUser.id });

      ownershipMock.resolveOwnerId.mockResolvedValue(adminAuthUser.id);
      courseRepositoryMock.create.mockResolvedValue(course);

      await service.create(adminAuthUser, { title: "test", description: "test" });

      expect(ownershipMock.resolveOwnerId).toHaveBeenCalledWith(adminAuthUser, undefined);
      expect(courseRepositoryMock.create).toHaveBeenCalledWith({
        userId: adminAuthUser.id,
        title: "TEST",
        description: "test",
      });
    });

    it("should throw AuthorizationError when user tries to create a course for another user", async () => {
      ownershipMock.resolveOwnerId.mockRejectedValue(new AuthorizationError("Ação não autorizada"));

      const promise = service.create(userAuthUser, { userId: "other-id", title: "test" });

      await expect(promise).rejects.toBeInstanceOf(AuthorizationError);
      await expect(promise).rejects.toThrow("Ação não autorizada");
      expect(courseRepositoryMock.create).not.toHaveBeenCalled();
    });

    it("should throw NotFoundError when admin tries to create a course for a non-existent user", async () => {
      ownershipMock.resolveOwnerId.mockRejectedValue(new NotFoundError("Usuário não encontrado"));

      const promise = service.create(adminAuthUser, { userId: "fake-id", title: "test" });

      await expect(promise).rejects.toBeInstanceOf(NotFoundError);
      await expect(promise).rejects.toThrow("Usuário não encontrado");
      expect(courseRepositoryMock.create).not.toHaveBeenCalled();
    });

    it("should propagate repository create error", async () => {
      ownershipMock.resolveOwnerId.mockResolvedValue(userAuthUser.id);
      courseRepositoryMock.create.mockRejectedValue(new Error("db error"));

      const promise = service.create(userAuthUser, { title: "test" });

      await expect(promise).rejects.toBeInstanceOf(Error);
      expect(courseRepositoryMock.create).toHaveBeenCalledTimes(1);
    });

  });

  describe("findById", () => {

    it("should find a course by id as ADMIN using findById", async () => {
      const course = makeCourse({ userId: userAuthUser.id });

      courseRepositoryMock.findById.mockResolvedValue(course);

      const result = await service.findById(adminAuthUser, course.id);

      expect(courseRepositoryMock.findById).toHaveBeenCalledWith(course.id);
      expect(courseRepositoryMock.findOwnedById).not.toHaveBeenCalled();
      expect(result).toEqual({
        id: course.id,
        title: course.title,
        description: course.description,
        createdAt: course.createdAt.toISOString(),
        updatedAt: course.updatedAt.toISOString(),
      });
      expect(result).not.toHaveProperty("deletedAt");
      expect(result).not.toHaveProperty("userId");
    });

    it("should find a course by id as USER using findOwnedById", async () => {
      const course = makeCourse({ userId: userAuthUser.id });

      courseRepositoryMock.findOwnedById.mockResolvedValue(course);

      const result = await service.findById(userAuthUser, course.id);

      expect(courseRepositoryMock.findOwnedById).toHaveBeenCalledWith(course.id, userAuthUser.id);
      expect(courseRepositoryMock.findById).not.toHaveBeenCalled();
      expect(result).not.toHaveProperty("deletedAt");
      expect(result).not.toHaveProperty("userId");
    });

    it("should return null when ADMIN course is not found", async () => {
      courseRepositoryMock.findById.mockResolvedValue(null);

      const result = await service.findById(adminAuthUser, "fake-id");

      expect(result).toBeNull();
      expect(courseRepositoryMock.findOwnedById).not.toHaveBeenCalled();
    });

    it("should return null when USER course is not found", async () => {
      courseRepositoryMock.findOwnedById.mockResolvedValue(null);

      const result = await service.findById(userAuthUser, "fake-id");

      expect(result).toBeNull();
      expect(courseRepositoryMock.findById).not.toHaveBeenCalled();
    });

    it("should propagate findById repository error", async () => {
      courseRepositoryMock.findById.mockRejectedValue(new Error("db error"));

      const promise = service.findById(adminAuthUser, "any-id");

      await expect(promise).rejects.toBeInstanceOf(Error);
    });

    it("should propagate findOwnedById repository error", async () => {
      courseRepositoryMock.findOwnedById.mockRejectedValue(new Error("db error"));

      const promise = service.findById(userAuthUser, "any-id");

      await expect(promise).rejects.toBeInstanceOf(Error);
    });

  });


  describe("findAllByUserId", () => {

    it("should return all courses for the authenticated user", async () => {
      const course1 = makeCourse({ userId: userAuthUser.id });
      const course2 = makeCourse({ userId: userAuthUser.id });

      ownershipMock.validateOwnership.mockReturnValue(undefined);
      courseRepositoryMock.findAllByUserId.mockResolvedValue([course1, course2]);

      const result = await service.findAllByUserId(userAuthUser, userAuthUser.id);

      expect(ownershipMock.validateOwnership).toHaveBeenCalledWith(userAuthUser, userAuthUser.id);
      expect(courseRepositoryMock.findAllByUserId).toHaveBeenCalledWith(userAuthUser.id);
      expect(result).toHaveLength(2);
      result.forEach((c) => {
        expect(c).not.toHaveProperty("deletedAt");
        expect(c).not.toHaveProperty("userId");
      });
    });

    it("should return empty array when user has no courses", async () => {
      ownershipMock.validateOwnership.mockReturnValue(undefined);
      courseRepositoryMock.findAllByUserId.mockResolvedValue([]);

      const result = await service.findAllByUserId(userAuthUser, userAuthUser.id);

      expect(result).toEqual([]);
      expect(courseRepositoryMock.findAllByUserId).toHaveBeenCalledWith(userAuthUser.id);
    });

    it("should allow ADMIN to access another user's courses", async () => {
      const course = makeCourse({ userId: userAuthUser.id });

      ownershipMock.validateOwnership.mockReturnValue(undefined);
      courseRepositoryMock.findAllByUserId.mockResolvedValue([course]);

      const result = await service.findAllByUserId(adminAuthUser, userAuthUser.id);

      expect(ownershipMock.validateOwnership).toHaveBeenCalledWith(adminAuthUser, userAuthUser.id);
      expect(courseRepositoryMock.findAllByUserId).toHaveBeenCalledWith(userAuthUser.id);
      expect(result).toHaveLength(1);
    });

    it("should throw AuthorizationError when USER tries to access another user's courses", async () => {
      ownershipMock.validateOwnership.mockImplementation(() => {
        throw new AuthorizationError("Ação não autorizada");
      });

      const promise = service.findAllByUserId(userAuthUser, "other-id");

      await expect(promise).rejects.toBeInstanceOf(AuthorizationError);
      await expect(promise).rejects.toThrow("Ação não autorizada");
      expect(courseRepositoryMock.findAllByUserId).not.toHaveBeenCalled();
    });

    it("should propagate repository findAllByUserId error", async () => {
      ownershipMock.validateOwnership.mockReturnValue(undefined);
      courseRepositoryMock.findAllByUserId.mockRejectedValue(new Error("db error"));

      const promise = service.findAllByUserId(userAuthUser, userAuthUser.id);

      await expect(promise).rejects.toBeInstanceOf(Error);
    });

  });


  describe("update", () => {

    it("should update a course title successfully as the owner", async () => {
      const course = makeCourse({ userId: userAuthUser.id });

      courseRepositoryMock.findById.mockResolvedValue(course);
      courseRepositoryMock.update.mockResolvedValue({ ...course, title: "UPDATED TITLE" });
      ownershipMock.validateOwnership.mockReturnValue(undefined);

      const result = await service.update(userAuthUser, course.id, { title: "updated title  " });

      expect(courseRepositoryMock.findById).toHaveBeenCalledWith(course.id);
      expect(ownershipMock.validateOwnership).toHaveBeenCalledWith(userAuthUser, course.userId);
      expect(courseRepositoryMock.update).toHaveBeenCalledWith(course.id, {
        title: "UPDATED TITLE",
        description: course.description,
      });
      expect(sanitizeMock.sanitizeName).toHaveBeenCalledWith("updated title  ");
      expect(result).not.toHaveProperty("userId");
      expect(result).not.toHaveProperty("deletedAt");
    });

    it("should update a course description successfully", async () => {
      const course = makeCourse({ userId: userAuthUser.id });

      courseRepositoryMock.findById.mockResolvedValue(course);
      courseRepositoryMock.update.mockResolvedValue({ ...course, description: "new description" });
      ownershipMock.validateOwnership.mockReturnValue(undefined);

      await service.update(userAuthUser, course.id, { description: "new description" });

      expect(courseRepositoryMock.update).toHaveBeenCalledWith(course.id, {
        title: course.title,
        description: "new description",
      });
      expect(sanitizeMock.sanitizeName).not.toHaveBeenCalled();
    });

    it("should allow ADMIN to update another user's course", async () => {
      const course = makeCourse({ userId: userAuthUser.id });

      courseRepositoryMock.findById.mockResolvedValue(course);
      courseRepositoryMock.update.mockResolvedValue(course);
      ownershipMock.validateOwnership.mockReturnValue(undefined);

      await service.update(adminAuthUser, course.id, { title: "admin update" });

      expect(ownershipMock.validateOwnership).toHaveBeenCalledWith(adminAuthUser, course.userId);
      expect(courseRepositoryMock.update).toHaveBeenCalledTimes(1);
    });

    it("should throw NotFoundError when course does not exist", async () => {
      courseRepositoryMock.findById.mockResolvedValue(null);

      const promise = service.update(userAuthUser, "fake-id", { title: "test" });

      await expect(promise).rejects.toBeInstanceOf(NotFoundError);
      await expect(promise).rejects.toThrow("Curso não encontrado");
      expect(ownershipMock.validateOwnership).not.toHaveBeenCalled();
      expect(courseRepositoryMock.update).not.toHaveBeenCalled();
    });

    it("should throw AuthorizationError when USER tries to update another user's course", async () => {
      const course = makeCourse({ userId: "other-id" });

      courseRepositoryMock.findById.mockResolvedValue(course);
      ownershipMock.validateOwnership.mockImplementation(() => {
        throw new AuthorizationError("Ação não autorizada");
      });

      const promise = service.update(userAuthUser, course.id, { title: "hacker" });

      await expect(promise).rejects.toBeInstanceOf(AuthorizationError);
      await expect(promise).rejects.toThrow("Ação não autorizada");
      expect(courseRepositoryMock.update).not.toHaveBeenCalled();
      expect(sanitizeMock.sanitizeName).not.toHaveBeenCalled();
    });

    it("should propagate findById repository error", async () => {
      courseRepositoryMock.findById.mockRejectedValue(new Error("db error"));

      const promise = service.update(userAuthUser, "any-id", { title: "test" });

      await expect(promise).rejects.toBeInstanceOf(Error);
      expect(courseRepositoryMock.update).not.toHaveBeenCalled();
    });

    it("should propagate update repository error", async () => {
      const course = makeCourse({ userId: userAuthUser.id });

      courseRepositoryMock.findById.mockResolvedValue(course);
      courseRepositoryMock.update.mockRejectedValue(new Error("db error"));
      ownershipMock.validateOwnership.mockReturnValue(undefined);

      const promise = service.update(userAuthUser, course.id, { title: "test" });

      await expect(promise).rejects.toBeInstanceOf(Error);
      expect(courseRepositoryMock.update).toHaveBeenCalledTimes(1);
    });

  });


  describe("softDelete", () => {

    it("should soft delete course and its modules inside a transaction", async () => {
      const course = makeCourse({ userId: userAuthUser.id });

      courseRepositoryMock.findById.mockResolvedValue(course);
      ownershipMock.validateOwnership.mockReturnValue(undefined);

      await service.softDelete(userAuthUser, course.id);

      expect(transactionMock.execute).toHaveBeenCalledTimes(1);
      expect(courseRepositoryMock.findById).toHaveBeenCalledWith(course.id);
      expect(ownershipMock.validateOwnership).toHaveBeenCalledWith(userAuthUser, course.userId);
      expect(moduleRepositoryMock.softDeleteAllByCourseIds).toHaveBeenCalledWith([course.id]);
      expect(courseRepositoryMock.softDelete).toHaveBeenCalledWith(course.id, course.userId);
      expect(goalRepositoryMock.deleteAllByCourseIds).toHaveBeenCalledTimes(1);
      expect(goalRepositoryMock.deleteAllByCourseIds).toHaveBeenCalledWith([course.id]);
      expect(studySessionRepositoryMock.deleteAllByCourseIds).toHaveBeenCalledTimes(1);
      expect(studySessionRepositoryMock.deleteAllByCourseIds).toHaveBeenCalledWith([course.id]);
    });

    it("should allow ADMIN to soft delete another user's course", async () => {
      const course = makeCourse({ userId: userAuthUser.id });

      courseRepositoryMock.findById.mockResolvedValue(course);
      ownershipMock.validateOwnership.mockReturnValue(undefined);

      await service.softDelete(adminAuthUser, course.id);

      expect(ownershipMock.validateOwnership).toHaveBeenCalledWith(adminAuthUser, course.userId);
      expect(courseRepositoryMock.softDelete).toHaveBeenCalledWith(course.id, course.userId);
      expect(goalRepositoryMock.deleteAllByCourseIds).toHaveBeenCalledTimes(1);
      expect(goalRepositoryMock.deleteAllByCourseIds).toHaveBeenCalledWith([course.id]);
      expect(studySessionRepositoryMock.deleteAllByCourseIds).toHaveBeenCalledTimes(1);
      expect(studySessionRepositoryMock.deleteAllByCourseIds).toHaveBeenCalledWith([course.id]);
    });

    it("should return undefined idempotently when course does not exist", async () => {
      courseRepositoryMock.findById.mockResolvedValue(null);

      const result = await service.softDelete(userAuthUser, "fake-id");

      expect(result).toBeUndefined();
      expect(transactionMock.execute).toHaveBeenCalledTimes(1);
      expect(ownershipMock.validateOwnership).not.toHaveBeenCalled();
      expect(moduleRepositoryMock.softDeleteAllByCourseIds).not.toHaveBeenCalled();
      expect(courseRepositoryMock.softDelete).not.toHaveBeenCalled();
      expect(goalRepositoryMock.deleteAllByCourseIds).not.toHaveBeenCalled();
      expect(studySessionRepositoryMock.deleteAllByCourseIds).not.toHaveBeenCalled();


    });

    it("should throw AuthorizationError when USER tries to delete another user's course", async () => {
      const course = makeCourse({ userId: "other-id" });

      courseRepositoryMock.findById.mockResolvedValue(course);
      ownershipMock.validateOwnership.mockImplementation(() => {
        throw new AuthorizationError("Ação não autorizada");
      });

      const promise = service.softDelete(userAuthUser, course.id);

      await expect(promise).rejects.toBeInstanceOf(AuthorizationError);
      await expect(promise).rejects.toThrow("Ação não autorizada");
      expect(moduleRepositoryMock.softDeleteAllByCourseIds).not.toHaveBeenCalled();
      expect(courseRepositoryMock.softDelete).not.toHaveBeenCalled();
      expect(goalRepositoryMock.deleteAllByCourseIds).not.toHaveBeenCalled();
      expect(studySessionRepositoryMock.deleteAllByCourseIds).not.toHaveBeenCalled();


    });

    it("should propagate findById repository error", async () => {
      courseRepositoryMock.findById.mockRejectedValue(new Error("db error"));

      const promise = service.softDelete(userAuthUser, "any-id");

      await expect(promise).rejects.toBeInstanceOf(Error);
      expect(moduleRepositoryMock.softDeleteAllByCourseIds).not.toHaveBeenCalled();
      expect(courseRepositoryMock.softDelete).not.toHaveBeenCalled();
      expect(goalRepositoryMock.deleteAllByCourseIds).not.toHaveBeenCalled();
      expect(studySessionRepositoryMock.deleteAllByCourseIds).not.toHaveBeenCalled();


    });

    it("should propagate softDelete repository error", async () => {
      const course = makeCourse({ userId: userAuthUser.id });

      courseRepositoryMock.findById.mockResolvedValue(course);
      ownershipMock.validateOwnership.mockReturnValue(undefined);
      courseRepositoryMock.softDelete.mockRejectedValue(new Error("db error"));

      const promise = service.softDelete(userAuthUser, course.id);

      await expect(promise).rejects.toBeInstanceOf(Error);
      expect(moduleRepositoryMock.softDeleteAllByCourseIds).toHaveBeenCalledTimes(1);
      expect(courseRepositoryMock.softDelete).toHaveBeenCalledTimes(1);
      expect(goalRepositoryMock.deleteAllByCourseIds).toHaveBeenCalledTimes(1);
      expect(goalRepositoryMock.deleteAllByCourseIds).toHaveBeenCalledWith([course.id]);
      expect(studySessionRepositoryMock.deleteAllByCourseIds).toHaveBeenCalledTimes(1);
      expect(studySessionRepositoryMock.deleteAllByCourseIds).toHaveBeenCalledWith([course.id]);

    });

  });

});