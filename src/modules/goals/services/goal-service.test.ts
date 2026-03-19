import { AuthorizationError } from "../../../shared/errors/authorization.error";
import { NotFoundError } from "../../../shared/errors/not-found-error";
import { ValidationError } from "../../../shared/errors/validation-error";
import type { IOwnershipService } from "../../../shared/ownership/ownership-service.interface";
import type { Isanitize } from "../../../shared/sanitize/interfaces/sanitize.interface";
import type { AuthUserDTO } from "../../../shared/DTOs/auth-user.DTO";
import type { IGoalRepository } from "../interfaces/repositories/goal-respository.interface";
import type { ICourseRepository } from "../../courses/interfaces/repositories/course-repository.interface";
import type { IModuleRepository } from "../../modules/interfaces/repositories/module-repository.interface";
import type { IDisciplineRepository } from "../../disciplines/interfaces/repositories/discipline-repository.interface";
import { GoalService } from "./goal.service";
import { makeGoal } from "../../../tests/factories/make-goal";
import { makeCourse } from "../../../tests/factories/make-course";
import { makeModule } from "../../../tests/factories/make-module";
import { makeDiscipline } from "../../../tests/factories/make-discipline";

describe("GoalService", () => {

  const goalRepositoryMock: jest.Mocked<IGoalRepository> = {
    findById: jest.fn(),
    findByIdWithOwner: jest.fn(),
    findAllByUserId: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    deleteAllByCourseIds: jest.fn(),
    deleteAllByModuleIds: jest.fn(),
    deleteAllByDisciplineIds: jest.fn(),
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

  const adminAuthUser: AuthUserDTO = { id: "admin-id", role: "ADMIN", sessionId: "default" };
  const userAuthUser: AuthUserDTO = { id: "user-id", role: "USER", sessionId: "default" };

  const service = new GoalService(
    goalRepositoryMock,
    sanitizeMock,
    ownershipMock,
    courseRepositoryMock,
    disciplineRepositoryMock,
    moduleRepositoryMock,
  );

  beforeEach(() => {
    jest.clearAllMocks();
    sanitizeMock.sanitizeName.mockImplementation((value) => value.toUpperCase().trim());
  });


  describe("create", () => {

    it("should create a general goal successfully", async () => {
      const goal = makeGoal({ userId: userAuthUser.id });

      ownershipMock.resolveOwnerId.mockResolvedValue(userAuthUser.id);
      goalRepositoryMock.create.mockResolvedValue(goal);

      const result = await service.create(userAuthUser, {
        title: "my goal  ",
        type: "DAILY_ONCE",
        targetMinutes: 60,
        startDate: new Date().toISOString(),
      });

      expect(ownershipMock.resolveOwnerId).toHaveBeenCalledTimes(1);
      expect(ownershipMock.resolveOwnerId).toHaveBeenCalledWith(userAuthUser, undefined);
      expect(sanitizeMock.sanitizeName).toHaveBeenCalledWith("my goal  ");
      expect(goalRepositoryMock.create).toHaveBeenCalledTimes(1);
      expect(goalRepositoryMock.create).toHaveBeenCalledWith(expect.objectContaining({
        userId: userAuthUser.id,
        title: "MY GOAL",
        type: "DAILY_ONCE",
        targetMinutes: 60,
        courseId: null,
        moduleId: null,
        disciplineId: null,
        endDate: null,
      }));
      expect(result).not.toHaveProperty("userId");
    });

    it("should create a goal with courseId", async () => {
      const course = makeCourse({ userId: userAuthUser.id });
      const goal = makeGoal({ userId: userAuthUser.id, courseId: course.id });

      ownershipMock.resolveOwnerId.mockResolvedValue(userAuthUser.id);
      courseRepositoryMock.findOwnedById.mockResolvedValue(course);
      goalRepositoryMock.create.mockResolvedValue(goal);

      await service.create(userAuthUser, {
        title: "course goal",
        type: "TOTAL_IN_PERIOD",
        targetMinutes: 120,
        startDate: new Date().toISOString(),
        courseId: course.id,
      });

      expect(courseRepositoryMock.findOwnedById).toHaveBeenCalledTimes(1);
      expect(courseRepositoryMock.findOwnedById).toHaveBeenCalledWith(course.id, course.userId);
      expect(goalRepositoryMock.create).toHaveBeenCalledWith(
        expect.objectContaining({ courseId: course.id })
      );
    });

    it("should create a goal with moduleId", async () => {
      const module = { ...makeModule(), course: { userId: userAuthUser.id } };
      const goal = makeGoal({ userId: userAuthUser.id, moduleId: module.id });

      ownershipMock.resolveOwnerId.mockResolvedValue(userAuthUser.id);
      moduleRepositoryMock.findByIdWithCourse.mockResolvedValue(module);
      goalRepositoryMock.create.mockResolvedValue(goal);

      await service.create(userAuthUser, {
        title: "module goal",
        type: "DAILY_RECURRING",
        targetMinutes: 30,
        startDate: new Date().toISOString(),
        moduleId: module.id,
      });

      expect(moduleRepositoryMock.findByIdWithCourse).toHaveBeenCalledTimes(1);
      expect(moduleRepositoryMock.findByIdWithCourse).toHaveBeenCalledWith(module.id);
      expect(goalRepositoryMock.create).toHaveBeenCalledWith(
        expect.objectContaining({ moduleId: module.id })
      );
    });

    it("should create a goal with disciplineId", async () => {
      const discipline = { ...makeDiscipline(), module: { course: { userId: userAuthUser.id } } };
      const goal = makeGoal({ userId: userAuthUser.id, disciplineId: discipline.id });

      ownershipMock.resolveOwnerId.mockResolvedValue(userAuthUser.id);
      disciplineRepositoryMock.findByIdWithCourse.mockResolvedValue(discipline);
      goalRepositoryMock.create.mockResolvedValue(goal);

      await service.create(userAuthUser, {
        title: "discipline goal",
        type: "TOTAL_BY_DATE",
        targetMinutes: 45,
        startDate: new Date().toISOString(),
        disciplineId: discipline.id,
      });

      expect(disciplineRepositoryMock.findByIdWithCourse).toHaveBeenCalledTimes(1);
      expect(disciplineRepositoryMock.findByIdWithCourse).toHaveBeenCalledWith(discipline.id);
      expect(goalRepositoryMock.create).toHaveBeenCalledWith(
        expect.objectContaining({ disciplineId: discipline.id })
      );
    });

    it("should allow ADMIN to create a goal for another user", async () => {
      const goal = makeGoal({ userId: userAuthUser.id });

      ownershipMock.resolveOwnerId.mockResolvedValue(userAuthUser.id);
      goalRepositoryMock.create.mockResolvedValue(goal);

      await service.create(adminAuthUser, {
        title: "goal",
        type: "DAILY_ONCE",
        targetMinutes: 60,
        startDate: new Date().toISOString(),
        userId: userAuthUser.id,
      });

      expect(ownershipMock.resolveOwnerId).toHaveBeenCalledWith(adminAuthUser, userAuthUser.id);
      expect(goalRepositoryMock.create).toHaveBeenCalledTimes(1);
    });

    it("should throw ValidationError when more than one scope is provided", async () => {
      const course = makeCourse({ userId: userAuthUser.id });
      const module = makeModule({ courseId: course.id });

      ownershipMock.resolveOwnerId.mockResolvedValue(userAuthUser.id);

      const promise = service.create(userAuthUser, {
        title: "goal",
        type: "DAILY_ONCE",
        targetMinutes: 60,
        startDate: new Date().toISOString(),
        courseId: course.id,
        moduleId: module.id,
      });

      await expect(promise).rejects.toBeInstanceOf(ValidationError);
      await expect(promise).rejects.toThrow("Meta pode ter apenas um escopo");
      expect(goalRepositoryMock.create).not.toHaveBeenCalled();
    });

    it("should throw NotFoundError when courseId does not exist", async () => {
      ownershipMock.resolveOwnerId.mockResolvedValue(userAuthUser.id);
      courseRepositoryMock.findOwnedById.mockResolvedValue(null);

      const promise = service.create(userAuthUser, {
        title: "goal",
        type: "DAILY_ONCE",
        targetMinutes: 60,
        startDate: new Date().toISOString(),
        courseId: "fake-id",
      });

      await expect(promise).rejects.toBeInstanceOf(NotFoundError);
      await expect(promise).rejects.toThrow("Curso não encontrado");
      expect(goalRepositoryMock.create).not.toHaveBeenCalled();
    });

    it("should throw NotFoundError when moduleId does not exist", async () => {
      ownershipMock.resolveOwnerId.mockResolvedValue(userAuthUser.id);
      moduleRepositoryMock.findByIdWithCourse.mockResolvedValue(null);

      const promise = service.create(userAuthUser, {
        title: "goal",
        type: "DAILY_ONCE",
        targetMinutes: 60,
        startDate: new Date().toISOString(),
        moduleId: "fake-id",
      });

      await expect(promise).rejects.toBeInstanceOf(NotFoundError);
      await expect(promise).rejects.toThrow("Módulo não encontrado");
      expect(goalRepositoryMock.create).not.toHaveBeenCalled();
    });

    it("should throw NotFoundError when disciplineId does not exist", async () => {
      ownershipMock.resolveOwnerId.mockResolvedValue(userAuthUser.id);
      disciplineRepositoryMock.findByIdWithCourse.mockResolvedValue(null);

      const promise = service.create(userAuthUser, {
        title: "goal",
        type: "DAILY_ONCE",
        targetMinutes: 60,
        startDate: new Date().toISOString(),
        disciplineId: "fake-id",
      });

      await expect(promise).rejects.toBeInstanceOf(NotFoundError);
      await expect(promise).rejects.toThrow("Disciplina não encontrada");
      expect(goalRepositoryMock.create).not.toHaveBeenCalled();
    });

    it("should throw AuthorizationError when USER tries to create a goal for another user", async () => {
      ownershipMock.resolveOwnerId.mockRejectedValue(new AuthorizationError("Ação não autorizada"));

      const promise = service.create(userAuthUser, {
        title: "goal",
        type: "DAILY_ONCE",
        targetMinutes: 60,
        startDate: new Date().toISOString(),
        userId: "other-id",
      });

      await expect(promise).rejects.toBeInstanceOf(AuthorizationError);
      await expect(promise).rejects.toThrow("Ação não autorizada");
      expect(goalRepositoryMock.create).not.toHaveBeenCalled();
    });

    it("should propagate goalRepository create error", async () => {
      ownershipMock.resolveOwnerId.mockResolvedValue(userAuthUser.id);
      goalRepositoryMock.create.mockRejectedValue(new Error("db error"));

      const promise = service.create(userAuthUser, {
        title: "goal",
        type: "DAILY_ONCE",
        targetMinutes: 60,
        startDate: new Date().toISOString(),
      });

      await expect(promise).rejects.toThrow("db error");
      expect(goalRepositoryMock.create).toHaveBeenCalledTimes(1);
    });

  });


  describe("findById", () => {

    it("should find a goal by id as ADMIN using findById", async () => {
      const goal = makeGoal();

      goalRepositoryMock.findById.mockResolvedValue(goal);

      const result = await service.findById(adminAuthUser, goal.id);

      expect(goalRepositoryMock.findById).toHaveBeenCalledTimes(1);
      expect(goalRepositoryMock.findById).toHaveBeenCalledWith(goal.id);
      expect(goalRepositoryMock.findByIdWithOwner).not.toHaveBeenCalled();
      expect(result).not.toHaveProperty("userId");
    });

    it("should find a goal by id as USER using findByIdWithOwner", async () => {
      const goal = makeGoal({ userId: userAuthUser.id });

      goalRepositoryMock.findByIdWithOwner.mockResolvedValue(goal);

      const result = await service.findById(userAuthUser, goal.id);

      expect(goalRepositoryMock.findByIdWithOwner).toHaveBeenCalledTimes(1);
      expect(goalRepositoryMock.findByIdWithOwner).toHaveBeenCalledWith(goal.id, userAuthUser.id);
      expect(goalRepositoryMock.findById).not.toHaveBeenCalled();
      expect(result).not.toHaveProperty("userId");
    });

    it("should return null when ADMIN goal is not found", async () => {
      goalRepositoryMock.findById.mockResolvedValue(null);

      const result = await service.findById(adminAuthUser, "fake-id");

      expect(result).toBeNull();
      expect(goalRepositoryMock.findByIdWithOwner).not.toHaveBeenCalled();
    });

    it("should return null when USER goal is not found", async () => {
      goalRepositoryMock.findByIdWithOwner.mockResolvedValue(null);

      const result = await service.findById(userAuthUser, "fake-id");

      expect(result).toBeNull();
      expect(goalRepositoryMock.findById).not.toHaveBeenCalled();
    });

    it("should propagate findById repository error for ADMIN", async () => {
      goalRepositoryMock.findById.mockRejectedValue(new Error("db error"));

      const promise = service.findById(adminAuthUser, "any-id");

      await expect(promise).rejects.toThrow("db error");
    });

    it("should propagate findByIdWithOwner repository error for USER", async () => {
      goalRepositoryMock.findByIdWithOwner.mockRejectedValue(new Error("db error"));

      const promise = service.findById(userAuthUser, "any-id");

      await expect(promise).rejects.toThrow("db error");
    });

  });


  describe("findAllByUserId", () => {

    it("should return all goals for the authenticated user", async () => {
      const goal1 = makeGoal({ userId: userAuthUser.id });
      const goal2 = makeGoal({ userId: userAuthUser.id });

      ownershipMock.validateOwnership.mockReturnValue(undefined);
      goalRepositoryMock.findAllByUserId.mockResolvedValue([goal1, goal2]);

      const result = await service.findAllByUserId(userAuthUser, userAuthUser.id);

      expect(ownershipMock.validateOwnership).toHaveBeenCalledTimes(1);
      expect(ownershipMock.validateOwnership).toHaveBeenCalledWith(userAuthUser, userAuthUser.id);
      expect(goalRepositoryMock.findAllByUserId).toHaveBeenCalledTimes(1);
      expect(goalRepositoryMock.findAllByUserId).toHaveBeenCalledWith(userAuthUser.id);
      expect(result).toHaveLength(2);
      result.forEach((g) => expect(g).not.toHaveProperty("userId"));
    });

    it("should allow ADMIN to access another user's goals", async () => {
      const goal1 = makeGoal({ userId: userAuthUser.id });

      ownershipMock.validateOwnership.mockReturnValue(undefined);
      goalRepositoryMock.findAllByUserId.mockResolvedValue([goal1]);

      const result = await service.findAllByUserId(adminAuthUser, userAuthUser.id);

      expect(ownershipMock.validateOwnership).toHaveBeenCalledWith(adminAuthUser, userAuthUser.id);
      expect(goalRepositoryMock.findAllByUserId).toHaveBeenCalledWith(userAuthUser.id);
      expect(result).toHaveLength(1);
    });

    it("should return empty array when user has no goals", async () => {
      ownershipMock.validateOwnership.mockReturnValue(undefined);
      goalRepositoryMock.findAllByUserId.mockResolvedValue([]);

      const result = await service.findAllByUserId(userAuthUser, userAuthUser.id);

      expect(result).toEqual([]);
      expect(goalRepositoryMock.findAllByUserId).toHaveBeenCalledTimes(1);
    });

    it("should throw AuthorizationError when USER tries to access another user's goals", async () => {
      ownershipMock.validateOwnership.mockImplementation(() => {
        throw new AuthorizationError("Ação não autorizada");
      });

      const promise = service.findAllByUserId(userAuthUser, "other-id");

      await expect(promise).rejects.toBeInstanceOf(AuthorizationError);
      await expect(promise).rejects.toThrow("Ação não autorizada");
      expect(goalRepositoryMock.findAllByUserId).not.toHaveBeenCalled();
    });

    it("should propagate repository findAllByUserId error", async () => {
      ownershipMock.validateOwnership.mockReturnValue(undefined);
      goalRepositoryMock.findAllByUserId.mockRejectedValue(new Error("db error"));

      const promise = service.findAllByUserId(userAuthUser, userAuthUser.id);

      await expect(promise).rejects.toThrow("db error");
    });

  });


  describe("update", () => {

    it("should update a goal title successfully as the owner", async () => {
      const goal = makeGoal({ userId: userAuthUser.id });
      const updatedGoal = { ...goal, title: "UPDATED TITLE" };

      goalRepositoryMock.findByIdWithOwner.mockResolvedValue(goal);
      goalRepositoryMock.update.mockResolvedValue(updatedGoal);

      const result = await service.update(userAuthUser, goal.id, { title: "updated title  " });

      expect(goalRepositoryMock.findByIdWithOwner).toHaveBeenCalledTimes(1);
      expect(goalRepositoryMock.findByIdWithOwner).toHaveBeenCalledWith(goal.id, userAuthUser.id);
      expect(sanitizeMock.sanitizeName).toHaveBeenCalledTimes(1);
      expect(sanitizeMock.sanitizeName).toHaveBeenCalledWith("updated title  ");
      expect(goalRepositoryMock.update).toHaveBeenCalledTimes(1);
      expect(goalRepositoryMock.update).toHaveBeenCalledWith(goal.id, expect.objectContaining({
        title: "UPDATED TITLE",
      }));
      expect(result).not.toHaveProperty("userId");
    });

    it("should update targetMinutes successfully", async () => {
      const goal = makeGoal({ userId: userAuthUser.id });
      const updatedGoal = { ...goal, targetMinutes: 30 };

      goalRepositoryMock.findByIdWithOwner.mockResolvedValue(goal);
      goalRepositoryMock.update.mockResolvedValue(updatedGoal);

      await service.update(userAuthUser, goal.id, { targetMinutes: 30 });

      expect(sanitizeMock.sanitizeName).not.toHaveBeenCalled();
      expect(goalRepositoryMock.update).toHaveBeenCalledWith(goal.id, expect.objectContaining({
        targetMinutes: 30,
      }));
    });

    it("should set endDate when provided", async () => {
      const goal = makeGoal({ userId: userAuthUser.id, endDate: null });
      const newEndDate = "2026-12-31T00:00:00.000Z";
      const updatedGoal = { ...goal, endDate: new Date(newEndDate) };

      goalRepositoryMock.findByIdWithOwner.mockResolvedValue(goal);
      goalRepositoryMock.update.mockResolvedValue(updatedGoal);

      await service.update(userAuthUser, goal.id, { endDate: newEndDate });

      expect(goalRepositoryMock.update).toHaveBeenCalledWith(goal.id, expect.objectContaining({
        endDate: new Date(newEndDate),
      }));
    });

    it("should set endDate to null when explicitly passed as null", async () => {
      const goal = makeGoal({ userId: userAuthUser.id });
      const updatedGoal = { ...goal, endDate: null };

      goalRepositoryMock.findByIdWithOwner.mockResolvedValue(goal);
      goalRepositoryMock.update.mockResolvedValue(updatedGoal);

      await service.update(userAuthUser, goal.id, { endDate: null });

      expect(goalRepositoryMock.update).toHaveBeenCalledWith(goal.id, expect.objectContaining({
        endDate: null,
      }));
    });

    it("should keep existing endDate when endDate is not provided", async () => {
      const existingEndDate = new Date("2026-06-30");
      const goal = makeGoal({ userId: userAuthUser.id, endDate: existingEndDate });
      const updatedGoal = { ...goal, title: "UPDATED" };

      goalRepositoryMock.findByIdWithOwner.mockResolvedValue(goal);
      goalRepositoryMock.update.mockResolvedValue(updatedGoal);

      await service.update(userAuthUser, goal.id, { title: "updated" });

      expect(goalRepositoryMock.update).toHaveBeenCalledWith(goal.id, expect.objectContaining({
        endDate: existingEndDate,
      }));
    });

    it("should allow ADMIN to update another user's goal", async () => {
      const goal = makeGoal({ userId: userAuthUser.id });

      goalRepositoryMock.findById.mockResolvedValue(goal);
      goalRepositoryMock.update.mockResolvedValue(goal);

      await service.update(adminAuthUser, goal.id, { title: "admin update" });

      expect(goalRepositoryMock.findById).toHaveBeenCalledWith(goal.id);
      expect(goalRepositoryMock.findByIdWithOwner).not.toHaveBeenCalled();
      expect(goalRepositoryMock.update).toHaveBeenCalledTimes(1);
    });

    it("should throw NotFoundError when goal does not exist as USER", async () => {
      goalRepositoryMock.findByIdWithOwner.mockResolvedValue(null);

      const promise = service.update(userAuthUser, "fake-id", { title: "title" });

      await expect(promise).rejects.toBeInstanceOf(NotFoundError);
      await expect(promise).rejects.toThrow("Meta não encontrada");
      expect(goalRepositoryMock.update).not.toHaveBeenCalled();
    });

    it("should throw NotFoundError when goal does not exist as ADMIN", async () => {
      goalRepositoryMock.findById.mockResolvedValue(null);

      const promise = service.update(adminAuthUser, "fake-id", { title: "title" });

      await expect(promise).rejects.toBeInstanceOf(NotFoundError);
      await expect(promise).rejects.toThrow("Meta não encontrada");
      expect(goalRepositoryMock.update).not.toHaveBeenCalled();
    });

    it("should propagate findByIdWithOwner repository error for USER", async () => {
      goalRepositoryMock.findByIdWithOwner.mockRejectedValue(new Error("db error"));

      const promise = service.update(userAuthUser, "any-id", { title: "title" });

      await expect(promise).rejects.toThrow("db error");
      expect(goalRepositoryMock.update).not.toHaveBeenCalled();
    });

    it("should propagate update repository error", async () => {
      const goal = makeGoal({ userId: userAuthUser.id });

      goalRepositoryMock.findByIdWithOwner.mockResolvedValue(goal);
      goalRepositoryMock.update.mockRejectedValue(new Error("db error"));

      const promise = service.update(userAuthUser, goal.id, { title: "title" });

      await expect(promise).rejects.toThrow("db error");
      expect(goalRepositoryMock.update).toHaveBeenCalledTimes(1);
    });

    it("should not change other fields when updating only title", async () => {
      const goal = makeGoal({ userId: userAuthUser.id });

      goalRepositoryMock.findByIdWithOwner.mockResolvedValue(goal);
      goalRepositoryMock.update.mockResolvedValue(goal);

      await service.update(userAuthUser, goal.id, { title: "new" });

      expect(goalRepositoryMock.update).toHaveBeenCalledWith(
        goal.id,
        expect.objectContaining({
          targetMinutes: goal.targetMinutes,
          endDate: goal.endDate,
        })
      );
    });

  });


  describe("delete", () => {

    it("should delete a goal as the owner", async () => {
      const goal = makeGoal({ userId: userAuthUser.id });

      goalRepositoryMock.findByIdWithOwner.mockResolvedValue(goal);

      await service.delete(userAuthUser, goal.id);

      expect(goalRepositoryMock.findByIdWithOwner).toHaveBeenCalledTimes(1);
      expect(goalRepositoryMock.findByIdWithOwner).toHaveBeenCalledWith(goal.id, userAuthUser.id);
      expect(goalRepositoryMock.delete).toHaveBeenCalledTimes(1);
      expect(goalRepositoryMock.delete).toHaveBeenCalledWith(goal.id);
    });

    it("should delete a goal as ADMIN using findById", async () => {
      const goal = makeGoal({ userId: userAuthUser.id });

      goalRepositoryMock.findById.mockResolvedValue(goal);

      await service.delete(adminAuthUser, goal.id);

      expect(goalRepositoryMock.findById).toHaveBeenCalledTimes(1);
      expect(goalRepositoryMock.findById).toHaveBeenCalledWith(goal.id);
      expect(goalRepositoryMock.findByIdWithOwner).not.toHaveBeenCalled();
      expect(goalRepositoryMock.delete).toHaveBeenCalledTimes(1);
      expect(goalRepositoryMock.delete).toHaveBeenCalledWith(goal.id);
    });

    it("should return undefined idempotently when goal does not exist as USER", async () => {
      goalRepositoryMock.findByIdWithOwner.mockResolvedValue(null);

      const result = await service.delete(userAuthUser, "fake-id");

      expect(result).toBeUndefined();
      expect(goalRepositoryMock.delete).not.toHaveBeenCalled();
    });

    it("should return undefined idempotently when goal does not exist as ADMIN", async () => {
      goalRepositoryMock.findById.mockResolvedValue(null);

      const result = await service.delete(adminAuthUser, "fake-id");

      expect(result).toBeUndefined();
      expect(goalRepositoryMock.delete).not.toHaveBeenCalled();
    });

    it("should propagate findByIdWithOwner error for USER", async () => {
      goalRepositoryMock.findByIdWithOwner.mockRejectedValue(new Error("db error"));

      const promise = service.delete(userAuthUser, "any-id");

      await expect(promise).rejects.toThrow("db error");
      expect(goalRepositoryMock.delete).not.toHaveBeenCalled();
    });

    it("should propagate findById error for ADMIN", async () => {
      goalRepositoryMock.findById.mockRejectedValue(new Error("db error"));

      const promise = service.delete(adminAuthUser, "any-id");

      await expect(promise).rejects.toThrow("db error");
      expect(goalRepositoryMock.delete).not.toHaveBeenCalled();
    });

    it("should propagate delete repository error", async () => {
      const goal = makeGoal({ userId: userAuthUser.id });

      goalRepositoryMock.findByIdWithOwner.mockResolvedValue(goal);
      goalRepositoryMock.delete.mockRejectedValue(new Error("db error"));

      const promise = service.delete(userAuthUser, goal.id);

      await expect(promise).rejects.toThrow("db error");
      expect(goalRepositoryMock.delete).toHaveBeenCalledTimes(1);
    });

  });

});