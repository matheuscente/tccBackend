import { AuthorizationError } from "../../../shared/errors/authorization.error";
import { NotFoundError } from "../../../shared/errors/not-found-error";
import { ValidationError } from "../../../shared/errors/validation-error";
import type { IOwnershipService } from "../../../shared/ownership/ownership-service.interface";
import type { AuthUserDTO } from "../../../shared/DTOs/auth-user.DTO";
import type { IStudySessionRepository } from "../interfaces/repositories/study-session-repository.interface";
import type { ICourseRepository } from "../../courses/interfaces/repositories/course-repository.interface";
import type { IModuleRepository } from "../../modules/interfaces/repositories/module-repository.interface";
import type { IDisciplineRepository } from "../../disciplines/interfaces/repositories/discipline-repository.interface";
import type { IDateConvert } from "../../../shared/convert/interfaces/date-convert.interface";
import { StudySessionService } from "./study-session.service";
import { makeStudySession } from "../../../tests/factories/make-study-session";
import { makeCourse } from "../../../tests/factories/make-course";
import { makeModule } from "../../../tests/factories/make-module";
import { makeDiscipline } from "../../../tests/factories/make-discipline";
import { StudySessionStatus } from "@prisma/client";

describe("StudySessionService", () => {

  const studySessionRepositoryMock: jest.Mocked<IStudySessionRepository> = {
    findById: jest.fn(),
    findByIdWithOwner: jest.fn(),
    findAllByUserId: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    deleteAllByCourseIds: jest.fn(),
    deleteAllByModuleIds: jest.fn(),
    deleteAllByDisciplineIds: jest.fn(),
    deleteAllByUserId: jest.fn(),
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

  const ownershipMock: jest.Mocked<IOwnershipService> = {
    resolveOwnerId: jest.fn(),
    validateOwnership: jest.fn(),
    validateStrictOwnership: jest.fn(),
  };

  const today = new Date(Date.UTC(2026, 2, 25));

  const dateUtilsMock: jest.Mocked<IDateConvert> = {
    dateToSeconds: jest.fn(),
    secondsToDate: jest.fn(),
    extractDate: jest.fn(),
    dateFormat: jest.fn(),
    getCurrentDate: jest.fn(),
    normalize: jest.fn(),
  };

  const adminAuthUser: AuthUserDTO = { id: "admin-id", role: "ADMIN", sessionId: "default" };
  const userAuthUser: AuthUserDTO = { id: "user-id", role: "USER", sessionId: "default" };

  const service = new StudySessionService(
    studySessionRepositoryMock,
    ownershipMock,
    courseRepositoryMock,
    disciplineRepositoryMock,
    moduleRepositoryMock,
    dateUtilsMock,
  );

  beforeEach(() => {
    jest.clearAllMocks();
    dateUtilsMock.getCurrentDate.mockReturnValue(today);
    dateUtilsMock.dateFormat.mockImplementation((date) => {
      if (date instanceof Date) return date;
      const [day, month, year] = (date as string).split("/").map(Number);
      return new Date(Date.UTC(year!, month! - 1, day!));
    });
  });

  describe("start", () => {

    it("should start a general study session successfully", async () => {
      const session = makeStudySession({ userId: userAuthUser.id, minutes: 0, status: StudySessionStatus.IN_PROGRESS });

      ownershipMock.resolveOwnerId.mockResolvedValue(userAuthUser.id);
      studySessionRepositoryMock.create.mockResolvedValue(session);

      const result = await service.start(userAuthUser, {
        userId: userAuthUser.id,
      });

      expect(ownershipMock.resolveOwnerId).toHaveBeenCalledTimes(1);
      expect(ownershipMock.resolveOwnerId).toHaveBeenCalledWith(userAuthUser, userAuthUser.id);
      expect(studySessionRepositoryMock.create).toHaveBeenCalledTimes(1);
      expect(studySessionRepositoryMock.create).toHaveBeenCalledWith(expect.objectContaining({
        userId: userAuthUser.id,
        minutes: 0,
        status: StudySessionStatus.IN_PROGRESS,
        courseId: null,
        moduleId: null,
        disciplineId: null,
      }));
      expect(result).not.toHaveProperty("userId");
      expect(result.status).toBe(StudySessionStatus.IN_PROGRESS);
      expect(result.minutes).toBe(0);
    });

    it("should start a session with courseId", async () => {
      const course = makeCourse({ userId: userAuthUser.id });
      const session = makeStudySession({ userId: userAuthUser.id, courseId: course.id, status: StudySessionStatus.IN_PROGRESS });

      ownershipMock.resolveOwnerId.mockResolvedValue(userAuthUser.id);
      courseRepositoryMock.findOwnedById.mockResolvedValue(course);
      studySessionRepositoryMock.create.mockResolvedValue(session);

      await service.start(userAuthUser, {
        userId: userAuthUser.id,
        courseId: course.id,
      });

      expect(courseRepositoryMock.findOwnedById).toHaveBeenCalledTimes(1);
      expect(courseRepositoryMock.findOwnedById).toHaveBeenCalledWith(course.id, userAuthUser.id);
      expect(moduleRepositoryMock.findByIdWithCourse).not.toHaveBeenCalled();
      expect(disciplineRepositoryMock.findByIdWithCourse).not.toHaveBeenCalled();
      expect(studySessionRepositoryMock.create).toHaveBeenCalledWith(
        expect.objectContaining({ courseId: course.id })
      );
    });

    it("should start a session with moduleId", async () => {
      const module = { ...makeModule(), course: { userId: userAuthUser.id } };
      const session = makeStudySession({ userId: userAuthUser.id, moduleId: module.id, status: StudySessionStatus.IN_PROGRESS });

      ownershipMock.resolveOwnerId.mockResolvedValue(userAuthUser.id);
      moduleRepositoryMock.findByIdWithCourse.mockResolvedValue(module);
      studySessionRepositoryMock.create.mockResolvedValue(session);

      await service.start(userAuthUser, {
        userId: userAuthUser.id,
        moduleId: module.id,
      });

      expect(moduleRepositoryMock.findByIdWithCourse).toHaveBeenCalledTimes(1);
      expect(moduleRepositoryMock.findByIdWithCourse).toHaveBeenCalledWith(module.id);
      expect(courseRepositoryMock.findOwnedById).not.toHaveBeenCalled();
      expect(disciplineRepositoryMock.findByIdWithCourse).not.toHaveBeenCalled();
      expect(studySessionRepositoryMock.create).toHaveBeenCalledWith(
        expect.objectContaining({ moduleId: module.id })
      );
    });

    it("should start a session with disciplineId", async () => {
      const discipline = { ...makeDiscipline(), module: { course: { userId: userAuthUser.id } } };
      const session = makeStudySession({ userId: userAuthUser.id, disciplineId: discipline.id, status: StudySessionStatus.IN_PROGRESS });

      ownershipMock.resolveOwnerId.mockResolvedValue(userAuthUser.id);
      disciplineRepositoryMock.findByIdWithCourse.mockResolvedValue(discipline);
      studySessionRepositoryMock.create.mockResolvedValue(session);

      await service.start(userAuthUser, {
        userId: userAuthUser.id,
        disciplineId: discipline.id,
      });

      expect(disciplineRepositoryMock.findByIdWithCourse).toHaveBeenCalledTimes(1);
      expect(disciplineRepositoryMock.findByIdWithCourse).toHaveBeenCalledWith(discipline.id);
      expect(courseRepositoryMock.findOwnedById).not.toHaveBeenCalled();
      expect(moduleRepositoryMock.findByIdWithCourse).not.toHaveBeenCalled();
      expect(studySessionRepositoryMock.create).toHaveBeenCalledWith(
        expect.objectContaining({ disciplineId: discipline.id })
      );
    });

    it("should allow ADMIN to start a session for another user", async () => {
      const session = makeStudySession({ userId: userAuthUser.id, status: StudySessionStatus.IN_PROGRESS });

      ownershipMock.resolveOwnerId.mockResolvedValue(userAuthUser.id);
      studySessionRepositoryMock.create.mockResolvedValue(session);

      await service.start(adminAuthUser, {
        userId: userAuthUser.id,
      });

      expect(ownershipMock.resolveOwnerId).toHaveBeenCalledWith(adminAuthUser, userAuthUser.id);
      expect(studySessionRepositoryMock.create).toHaveBeenCalledTimes(1);
    });

    it("should throw ValidationError when courseId and moduleId are provided", async () => {
      const promise = service.start(userAuthUser, {
        userId: userAuthUser.id,
        courseId: "course-id",
        moduleId: "module-id",
      });

      await expect(promise).rejects.toBeInstanceOf(ValidationError);
      await expect(promise).rejects.toThrow("Sessão de estudo pode ter apenas um escopo");
      expect(ownershipMock.resolveOwnerId).not.toHaveBeenCalled();
      expect(courseRepositoryMock.findOwnedById).not.toHaveBeenCalled();
      expect(moduleRepositoryMock.findByIdWithCourse).not.toHaveBeenCalled();
      expect(disciplineRepositoryMock.findByIdWithCourse).not.toHaveBeenCalled();
      expect(studySessionRepositoryMock.create).not.toHaveBeenCalled();
    });

    it("should throw ValidationError when courseId and disciplineId are provided", async () => {
      const promise = service.start(userAuthUser, {
        userId: userAuthUser.id,
        courseId: "course-id",
        disciplineId: "discipline-id",
      });

      await expect(promise).rejects.toBeInstanceOf(ValidationError);
      await expect(promise).rejects.toThrow("Sessão de estudo pode ter apenas um escopo");
      expect(ownershipMock.resolveOwnerId).not.toHaveBeenCalled();
      expect(studySessionRepositoryMock.create).not.toHaveBeenCalled();
    });

    it("should throw ValidationError when moduleId and disciplineId are provided", async () => {
      const promise = service.start(userAuthUser, {
        userId: userAuthUser.id,
        moduleId: "module-id",
        disciplineId: "discipline-id",
      });

      await expect(promise).rejects.toBeInstanceOf(ValidationError);
      await expect(promise).rejects.toThrow("Sessão de estudo pode ter apenas um escopo");
      expect(ownershipMock.resolveOwnerId).not.toHaveBeenCalled();
      expect(studySessionRepositoryMock.create).not.toHaveBeenCalled();
    });

    it("should throw ValidationError when all three scopes are provided", async () => {
      const promise = service.start(userAuthUser, {
        userId: userAuthUser.id,
        courseId: "course-id",
        moduleId: "module-id",
        disciplineId: "discipline-id",
      });

      await expect(promise).rejects.toBeInstanceOf(ValidationError);
      await expect(promise).rejects.toThrow("Sessão de estudo pode ter apenas um escopo");
      expect(ownershipMock.resolveOwnerId).not.toHaveBeenCalled();
      expect(studySessionRepositoryMock.create).not.toHaveBeenCalled();
    });

    it("should throw NotFoundError when courseId does not exist or does not belong to owner", async () => {
      ownershipMock.resolveOwnerId.mockResolvedValue(userAuthUser.id);
      courseRepositoryMock.findOwnedById.mockResolvedValue(null);

      const promise = service.start(userAuthUser, {
        userId: userAuthUser.id,
        courseId: "fake-id",
      });

      await expect(promise).rejects.toBeInstanceOf(NotFoundError);
      await expect(promise).rejects.toThrow("Curso não encontrado");
      expect(moduleRepositoryMock.findByIdWithCourse).not.toHaveBeenCalled();
      expect(disciplineRepositoryMock.findByIdWithCourse).not.toHaveBeenCalled();
      expect(studySessionRepositoryMock.create).not.toHaveBeenCalled();
    });

    it("should throw NotFoundError when moduleId does not exist", async () => {
      ownershipMock.resolveOwnerId.mockResolvedValue(userAuthUser.id);
      moduleRepositoryMock.findByIdWithCourse.mockResolvedValue(null);

      const promise = service.start(userAuthUser, {
        userId: userAuthUser.id,
        moduleId: "fake-id",
      });

      await expect(promise).rejects.toBeInstanceOf(NotFoundError);
      await expect(promise).rejects.toThrow("Módulo não encontrado");
      expect(courseRepositoryMock.findOwnedById).not.toHaveBeenCalled();
      expect(disciplineRepositoryMock.findByIdWithCourse).not.toHaveBeenCalled();
      expect(studySessionRepositoryMock.create).not.toHaveBeenCalled();
    });

    it("should throw AuthorizationError when module does not belong to owner", async () => {
      const module = { ...makeModule(), course: { userId: "other-user-id" } };

      ownershipMock.resolveOwnerId.mockResolvedValue(userAuthUser.id);
      moduleRepositoryMock.findByIdWithCourse.mockResolvedValue(module);

      const promise = service.start(userAuthUser, {
        userId: userAuthUser.id,
        moduleId: module.id,
      });

      await expect(promise).rejects.toBeInstanceOf(AuthorizationError);
      await expect(promise).rejects.toThrow("Ação não autorizada");
      expect(disciplineRepositoryMock.findByIdWithCourse).not.toHaveBeenCalled();
      expect(studySessionRepositoryMock.create).not.toHaveBeenCalled();
    });

    it("should throw NotFoundError when disciplineId does not exist", async () => {
      ownershipMock.resolveOwnerId.mockResolvedValue(userAuthUser.id);
      disciplineRepositoryMock.findByIdWithCourse.mockResolvedValue(null);

      const promise = service.start(userAuthUser, {
        userId: userAuthUser.id,
        disciplineId: "fake-id",
      });

      await expect(promise).rejects.toBeInstanceOf(NotFoundError);
      await expect(promise).rejects.toThrow("Disciplina não encontrada");
      expect(courseRepositoryMock.findOwnedById).not.toHaveBeenCalled();
      expect(moduleRepositoryMock.findByIdWithCourse).not.toHaveBeenCalled();
      expect(studySessionRepositoryMock.create).not.toHaveBeenCalled();
    });

    it("should throw AuthorizationError when discipline does not belong to owner", async () => {
      const discipline = { ...makeDiscipline(), module: { course: { userId: "other-user-id" } } };

      ownershipMock.resolveOwnerId.mockResolvedValue(userAuthUser.id);
      disciplineRepositoryMock.findByIdWithCourse.mockResolvedValue(discipline);

      const promise = service.start(userAuthUser, {
        userId: userAuthUser.id,
        disciplineId: discipline.id,
      });

      await expect(promise).rejects.toBeInstanceOf(AuthorizationError);
      await expect(promise).rejects.toThrow("Ação não autorizada");
      expect(studySessionRepositoryMock.create).not.toHaveBeenCalled();
    });

    it("should throw AuthorizationError when USER tries to start a session for another user", async () => {
      ownershipMock.resolveOwnerId.mockRejectedValue(new AuthorizationError("Ação não autorizada"));

      const promise = service.start(userAuthUser, {
        userId: "other-id",
      });

      await expect(promise).rejects.toBeInstanceOf(AuthorizationError);
      await expect(promise).rejects.toThrow("Ação não autorizada");
      expect(courseRepositoryMock.findOwnedById).not.toHaveBeenCalled();
      expect(moduleRepositoryMock.findByIdWithCourse).not.toHaveBeenCalled();
      expect(disciplineRepositoryMock.findByIdWithCourse).not.toHaveBeenCalled();
      expect(studySessionRepositoryMock.create).not.toHaveBeenCalled();
    });

    it("should propagate studySessionRepository create error", async () => {
      ownershipMock.resolveOwnerId.mockResolvedValue(userAuthUser.id);
      studySessionRepositoryMock.create.mockRejectedValue(new Error("db error"));

      const promise = service.start(userAuthUser, { userId: userAuthUser.id });

      await expect(promise).rejects.toThrow("db error");
      expect(studySessionRepositoryMock.create).toHaveBeenCalledTimes(1);
    });

  });


  describe("finish", () => {

    it("should finish a session successfully as USER and calculate minutes", async () => {
      const startedAt = new Date(Date.now() - 30 * 60 * 1000); // 30 minutos atrás
      const session = makeStudySession({ userId: userAuthUser.id, status: StudySessionStatus.IN_PROGRESS, startedAt, minutes: 0 });
      const updatedSession = { ...session, minutes: 30, status: StudySessionStatus.COMPLETED };

      studySessionRepositoryMock.findByIdWithOwner.mockResolvedValue(session);
      studySessionRepositoryMock.update.mockResolvedValue(updatedSession);

      const result = await service.finish(userAuthUser, session.id);

      expect(studySessionRepositoryMock.findByIdWithOwner).toHaveBeenCalledTimes(1);
      expect(studySessionRepositoryMock.findByIdWithOwner).toHaveBeenCalledWith(session.id, userAuthUser.id);
      expect(studySessionRepositoryMock.update).toHaveBeenCalledTimes(1);
      expect(studySessionRepositoryMock.update).toHaveBeenCalledWith(session.id, expect.objectContaining({
        status: StudySessionStatus.COMPLETED,
      }));
      expect(result.status).toBe(StudySessionStatus.COMPLETED);
      expect(result.minutes).toBe(30);
    });

    it("should set minimum 1 minute when session lasted less than 60 seconds", async () => {
      const startedAt = new Date(Date.now() - 10 * 1000); // 10 segundos atrás
      const session = makeStudySession({ userId: userAuthUser.id, status: StudySessionStatus.IN_PROGRESS, startedAt, minutes: 0 });
      const updatedSession = { ...session, minutes: 1, status: StudySessionStatus.COMPLETED };

      studySessionRepositoryMock.findByIdWithOwner.mockResolvedValue(session);
      studySessionRepositoryMock.update.mockResolvedValue(updatedSession);

      await service.finish(userAuthUser, session.id);

      expect(studySessionRepositoryMock.update).toHaveBeenCalledWith(session.id, expect.objectContaining({
        minutes: 1,
        status: StudySessionStatus.COMPLETED,
      }));
    });

    it("should finish a session as ADMIN using findById", async () => {
      const startedAt = new Date(Date.now() - 60 * 60 * 1000); // 60 minutos atrás
      const session = makeStudySession({ userId: userAuthUser.id, startedAt, minutes: 0 });
      const updatedSession = { ...session, minutes: 60, status: StudySessionStatus.COMPLETED };

      studySessionRepositoryMock.findById.mockResolvedValue(session);
      studySessionRepositoryMock.update.mockResolvedValue(updatedSession);

      await service.finish(adminAuthUser, session.id);

      expect(studySessionRepositoryMock.findById).toHaveBeenCalledWith(session.id);
      expect(studySessionRepositoryMock.findByIdWithOwner).not.toHaveBeenCalled();
      expect(studySessionRepositoryMock.update).toHaveBeenCalledWith(session.id, expect.objectContaining({
        status: StudySessionStatus.COMPLETED,
      }));
    });

    it("should throw NotFoundError when session does not exist as USER", async () => {
      studySessionRepositoryMock.findByIdWithOwner.mockResolvedValue(null);

      const promise = service.finish(userAuthUser, "fake-id");

      await expect(promise).rejects.toBeInstanceOf(NotFoundError);
      await expect(promise).rejects.toThrow("Sessão de estudo não encontrada");
      expect(studySessionRepositoryMock.update).not.toHaveBeenCalled();
    });

    it("should throw NotFoundError when session does not exist as ADMIN", async () => {
      studySessionRepositoryMock.findById.mockResolvedValue(null);

      const promise = service.finish(adminAuthUser, "fake-id");

      await expect(promise).rejects.toBeInstanceOf(NotFoundError);
      await expect(promise).rejects.toThrow("Sessão de estudo não encontrada");
      expect(studySessionRepositoryMock.update).not.toHaveBeenCalled();
    });

    it("should throw ValidationError when session is already COMPLETED", async () => {
      const session = makeStudySession({ userId: userAuthUser.id, status: StudySessionStatus.COMPLETED });

      studySessionRepositoryMock.findByIdWithOwner.mockResolvedValue(session);

      const promise = service.finish(userAuthUser, session.id);

      await expect(promise).rejects.toBeInstanceOf(ValidationError);
      await expect(promise).rejects.toThrow("Sessão de estudo já finalizada");
      expect(studySessionRepositoryMock.update).not.toHaveBeenCalled();
    });

    it("should propagate findByIdWithOwner error for USER", async () => {
      studySessionRepositoryMock.findByIdWithOwner.mockRejectedValue(new Error("db error"));

      const promise = service.finish(userAuthUser, "any-id");

      await expect(promise).rejects.toThrow("db error");
      expect(studySessionRepositoryMock.update).not.toHaveBeenCalled();
    });

    it("should propagate findById error for ADMIN", async () => {
      studySessionRepositoryMock.findById.mockRejectedValue(new Error("db error"));

      const promise = service.finish(adminAuthUser, "any-id");

      await expect(promise).rejects.toThrow("db error");
      expect(studySessionRepositoryMock.update).not.toHaveBeenCalled();
    });

    it("should propagate update repository error", async () => {
      const startedAt = new Date(Date.now() - 30 * 60 * 1000);
      const session = makeStudySession({ userId: userAuthUser.id, status: StudySessionStatus.IN_PROGRESS, startedAt });

      studySessionRepositoryMock.findByIdWithOwner.mockResolvedValue(session);
      studySessionRepositoryMock.update.mockRejectedValue(new Error("db error"));

      const promise = service.finish(userAuthUser, session.id);

      await expect(promise).rejects.toThrow("db error");
      expect(studySessionRepositoryMock.update).toHaveBeenCalledTimes(1);
    });

  });


  describe("update", () => {

    it("should throw error when trying to update minutes", async () => {
    await expect(
        service.update(userAuthUser, session.id, { minutes: 30 })
    ).rejects.toThrow(ValidationError)
})

    it("should update studiedAt successfully", async () => {
      const session = makeStudySession({ userId: userAuthUser.id, status: StudySessionStatus.COMPLETED });
      const newDate = new Date(Date.UTC(2026, 2, 1));
      const updatedSession = { ...session, studiedAt: newDate };

      studySessionRepositoryMock.findByIdWithOwner.mockResolvedValue(session);
      studySessionRepositoryMock.update.mockResolvedValue(updatedSession);
      dateUtilsMock.dateFormat.mockReturnValue(newDate);

      await service.update(userAuthUser, session.id, { studiedAt: "01/03/2026" });

      expect(dateUtilsMock.dateFormat).toHaveBeenCalledWith("01/03/2026");
      expect(studySessionRepositoryMock.update).toHaveBeenCalledWith(session.id, expect.objectContaining({
        studiedAt: newDate,
      }));
    });

    it("should keep existing studiedAt when not provided", async () => {
      const existingDate = new Date(Date.UTC(2026, 1, 15));
      const session = makeStudySession({ userId: userAuthUser.id, status: StudySessionStatus.COMPLETED, studiedAt: existingDate });
      const updatedSession = { ...session, minutes: 45 };

      studySessionRepositoryMock.findByIdWithOwner.mockResolvedValue(session);
      studySessionRepositoryMock.update.mockResolvedValue(updatedSession);

      await service.update(userAuthUser, session.id, { minutes: 45 });

      expect(dateUtilsMock.dateFormat).not.toHaveBeenCalled();
      expect(studySessionRepositoryMock.update).toHaveBeenCalledWith(session.id, expect.objectContaining({
        studiedAt: existingDate,
      }));
    });

    it("should allow ADMIN to update another user's session", async () => {
      const session = makeStudySession({ userId: userAuthUser.id, status: StudySessionStatus.COMPLETED });

      studySessionRepositoryMock.findById.mockResolvedValue(session);
      studySessionRepositoryMock.update.mockResolvedValue(session);

      await service.update(adminAuthUser, session.id, { minutes: 30 });

      expect(studySessionRepositoryMock.findById).toHaveBeenCalledWith(session.id);
      expect(studySessionRepositoryMock.findByIdWithOwner).not.toHaveBeenCalled();
      expect(studySessionRepositoryMock.update).toHaveBeenCalledTimes(1);
    });

    it("should throw ValidationError when minutes is zero", async () => {
      const promise = service.update(userAuthUser, "any-id", { minutes: 0 });

      await expect(promise).rejects.toBeInstanceOf(ValidationError);
      await expect(promise).rejects.toThrow("minutos deve ser maior que 0");
      expect(studySessionRepositoryMock.findByIdWithOwner).not.toHaveBeenCalled();
      expect(studySessionRepositoryMock.update).not.toHaveBeenCalled();
    });

    it("should throw ValidationError when minutes is negative", async () => {
      const promise = service.update(userAuthUser, "any-id", { minutes: -5 });

      await expect(promise).rejects.toBeInstanceOf(ValidationError);
      await expect(promise).rejects.toThrow("minutos deve ser maior que 0");
      expect(studySessionRepositoryMock.findByIdWithOwner).not.toHaveBeenCalled();
      expect(studySessionRepositoryMock.update).not.toHaveBeenCalled();
    });

    it("should throw ValidationError when studiedAt is in the future", async () => {
      dateUtilsMock.dateFormat.mockReturnValue(new Date(Date.UTC(2099, 0, 1)));

      const session = makeStudySession({ userId: userAuthUser.id, status: StudySessionStatus.COMPLETED });
      studySessionRepositoryMock.findByIdWithOwner.mockResolvedValue(session);

      const promise = service.update(userAuthUser, session.id, { studiedAt: "01/01/2099" });

      await expect(promise).rejects.toBeInstanceOf(ValidationError);
      await expect(promise).rejects.toThrow("Data estudada inválida");
      expect(studySessionRepositoryMock.update).not.toHaveBeenCalled();
    });

    it("should throw NotFoundError when session does not exist as USER", async () => {
      studySessionRepositoryMock.findByIdWithOwner.mockResolvedValue(null);

      const promise = service.update(userAuthUser, "fake-id", { minutes: 30 });

      await expect(promise).rejects.toBeInstanceOf(NotFoundError);
      await expect(promise).rejects.toThrow("Sessão de estudo não encontrada");
      expect(studySessionRepositoryMock.update).not.toHaveBeenCalled();
    });

    it("should throw NotFoundError when session does not exist as ADMIN", async () => {
      studySessionRepositoryMock.findById.mockResolvedValue(null);

      const promise = service.update(adminAuthUser, "fake-id", { minutes: 30 });

      await expect(promise).rejects.toBeInstanceOf(NotFoundError);
      await expect(promise).rejects.toThrow("Sessão de estudo não encontrada");
      expect(studySessionRepositoryMock.update).not.toHaveBeenCalled();
    });

    it("should propagate findByIdWithOwner error for USER", async () => {
      studySessionRepositoryMock.findByIdWithOwner.mockRejectedValue(new Error("db error"));

      const promise = service.update(userAuthUser, "any-id", { minutes: 30 });

      await expect(promise).rejects.toThrow("db error");
      expect(studySessionRepositoryMock.update).not.toHaveBeenCalled();
    });

    it("should propagate update repository error", async () => {
      const session = makeStudySession({ userId: userAuthUser.id, status: StudySessionStatus.COMPLETED });

      studySessionRepositoryMock.findByIdWithOwner.mockResolvedValue(session);
      studySessionRepositoryMock.update.mockRejectedValue(new Error("db error"));

      const promise = service.update(userAuthUser, session.id, { minutes: 30 });

      await expect(promise).rejects.toThrow("db error");
      expect(studySessionRepositoryMock.update).toHaveBeenCalledTimes(1);
    });

  });

  describe("findById", () => {

    it("should find a session by id as ADMIN using findById", async () => {
      const session = makeStudySession();

      studySessionRepositoryMock.findById.mockResolvedValue(session);

      const result = await service.findById(adminAuthUser, session.id);

      expect(studySessionRepositoryMock.findById).toHaveBeenCalledTimes(1);
      expect(studySessionRepositoryMock.findById).toHaveBeenCalledWith(session.id);
      expect(studySessionRepositoryMock.findByIdWithOwner).not.toHaveBeenCalled();
      expect(result).not.toHaveProperty("userId");
    });

    it("should find a session by id as USER using findByIdWithOwner", async () => {
      const session = makeStudySession({ userId: userAuthUser.id });

      studySessionRepositoryMock.findByIdWithOwner.mockResolvedValue(session);

      const result = await service.findById(userAuthUser, session.id);

      expect(studySessionRepositoryMock.findByIdWithOwner).toHaveBeenCalledTimes(1);
      expect(studySessionRepositoryMock.findByIdWithOwner).toHaveBeenCalledWith(session.id, userAuthUser.id);
      expect(studySessionRepositoryMock.findById).not.toHaveBeenCalled();
      expect(result).not.toHaveProperty("userId");
    });

    it("should return null when ADMIN session is not found", async () => {
      studySessionRepositoryMock.findById.mockResolvedValue(null);

      const result = await service.findById(adminAuthUser, "fake-id");

      expect(result).toBeNull();
      expect(studySessionRepositoryMock.findByIdWithOwner).not.toHaveBeenCalled();
    });

    it("should return null when USER session is not found", async () => {
      studySessionRepositoryMock.findByIdWithOwner.mockResolvedValue(null);

      const result = await service.findById(userAuthUser, "fake-id");

      expect(result).toBeNull();
      expect(studySessionRepositoryMock.findById).not.toHaveBeenCalled();
    });

    it("should propagate findById repository error for ADMIN", async () => {
      studySessionRepositoryMock.findById.mockRejectedValue(new Error("db error"));

      const promise = service.findById(adminAuthUser, "any-id");

      await expect(promise).rejects.toThrow("db error");
    });

    it("should propagate findByIdWithOwner repository error for USER", async () => {
      studySessionRepositoryMock.findByIdWithOwner.mockRejectedValue(new Error("db error"));

      const promise = service.findById(userAuthUser, "any-id");

      await expect(promise).rejects.toThrow("db error");
    });

  });


  describe("findAllByUserId", () => {

    it("should return all sessions for the authenticated user", async () => {
      const session1 = makeStudySession({ userId: userAuthUser.id });
      const session2 = makeStudySession({ userId: userAuthUser.id });

      ownershipMock.validateOwnership.mockReturnValue(undefined);
      studySessionRepositoryMock.findAllByUserId.mockResolvedValue([session1, session2]);

      const result = await service.findAllByUserId(userAuthUser, userAuthUser.id);

      expect(ownershipMock.validateOwnership).toHaveBeenCalledTimes(1);
      expect(ownershipMock.validateOwnership).toHaveBeenCalledWith(userAuthUser, userAuthUser.id);
      expect(studySessionRepositoryMock.findAllByUserId).toHaveBeenCalledTimes(1);
      expect(studySessionRepositoryMock.findAllByUserId).toHaveBeenCalledWith(userAuthUser.id);
      expect(result).toHaveLength(2);
      result.forEach((s) => expect(s).not.toHaveProperty("userId"));
    });

    it("should allow ADMIN to access another user's sessions", async () => {
      const session = makeStudySession({ userId: userAuthUser.id });

      ownershipMock.validateOwnership.mockReturnValue(undefined);
      studySessionRepositoryMock.findAllByUserId.mockResolvedValue([session]);

      const result = await service.findAllByUserId(adminAuthUser, userAuthUser.id);

      expect(ownershipMock.validateOwnership).toHaveBeenCalledWith(adminAuthUser, userAuthUser.id);
      expect(studySessionRepositoryMock.findAllByUserId).toHaveBeenCalledWith(userAuthUser.id);
      expect(result).toHaveLength(1);
    });

    it("should return empty array when user has no sessions", async () => {
      ownershipMock.validateOwnership.mockReturnValue(undefined);
      studySessionRepositoryMock.findAllByUserId.mockResolvedValue([]);

      const result = await service.findAllByUserId(userAuthUser, userAuthUser.id);

      expect(result).toEqual([]);
      expect(studySessionRepositoryMock.findAllByUserId).toHaveBeenCalledTimes(1);
    });

    it("should throw AuthorizationError when USER tries to access another user's sessions", async () => {
      ownershipMock.validateOwnership.mockImplementation(() => {
        throw new AuthorizationError("Ação não autorizada");
      });

      const promise = service.findAllByUserId(userAuthUser, "other-id");

      await expect(promise).rejects.toBeInstanceOf(AuthorizationError);
      await expect(promise).rejects.toThrow("Ação não autorizada");
      expect(studySessionRepositoryMock.findAllByUserId).not.toHaveBeenCalled();
    });

    it("should propagate repository findAllByUserId error", async () => {
      ownershipMock.validateOwnership.mockReturnValue(undefined);
      studySessionRepositoryMock.findAllByUserId.mockRejectedValue(new Error("db error"));

      const promise = service.findAllByUserId(userAuthUser, userAuthUser.id);

      await expect(promise).rejects.toThrow("db error");
    });

  });


  describe("delete", () => {

    it("should delete a session as the owner", async () => {
      const session = makeStudySession({ userId: userAuthUser.id });

      studySessionRepositoryMock.findByIdWithOwner.mockResolvedValue(session);

      await service.delete(userAuthUser, session.id);

      expect(studySessionRepositoryMock.findByIdWithOwner).toHaveBeenCalledTimes(1);
      expect(studySessionRepositoryMock.findByIdWithOwner).toHaveBeenCalledWith(session.id, userAuthUser.id);
      expect(studySessionRepositoryMock.delete).toHaveBeenCalledTimes(1);
      expect(studySessionRepositoryMock.delete).toHaveBeenCalledWith(session.id);
    });

    it("should delete a session as ADMIN using findById", async () => {
      const session = makeStudySession({ userId: userAuthUser.id });

      studySessionRepositoryMock.findById.mockResolvedValue(session);

      await service.delete(adminAuthUser, session.id);

      expect(studySessionRepositoryMock.findById).toHaveBeenCalledTimes(1);
      expect(studySessionRepositoryMock.findById).toHaveBeenCalledWith(session.id);
      expect(studySessionRepositoryMock.findByIdWithOwner).not.toHaveBeenCalled();
      expect(studySessionRepositoryMock.delete).toHaveBeenCalledTimes(1);
      expect(studySessionRepositoryMock.delete).toHaveBeenCalledWith(session.id);
    });

    it("should return undefined idempotently when session does not exist as USER", async () => {
      studySessionRepositoryMock.findByIdWithOwner.mockResolvedValue(null);

      const result = await service.delete(userAuthUser, "fake-id");

      expect(result).toBeUndefined();
      expect(studySessionRepositoryMock.delete).not.toHaveBeenCalled();
    });

    it("should return undefined idempotently when session does not exist as ADMIN", async () => {
      studySessionRepositoryMock.findById.mockResolvedValue(null);

      const result = await service.delete(adminAuthUser, "fake-id");

      expect(result).toBeUndefined();
      expect(studySessionRepositoryMock.delete).not.toHaveBeenCalled();
    });

    it("should propagate findByIdWithOwner error for USER", async () => {
      studySessionRepositoryMock.findByIdWithOwner.mockRejectedValue(new Error("db error"));

      const promise = service.delete(userAuthUser, "any-id");

      await expect(promise).rejects.toThrow("db error");
      expect(studySessionRepositoryMock.delete).not.toHaveBeenCalled();
    });

    it("should propagate findById error for ADMIN", async () => {
      studySessionRepositoryMock.findById.mockRejectedValue(new Error("db error"));

      const promise = service.delete(adminAuthUser, "any-id");

      await expect(promise).rejects.toThrow("db error");
      expect(studySessionRepositoryMock.delete).not.toHaveBeenCalled();
    });

    it("should propagate delete repository error", async () => {
      const session = makeStudySession({ userId: userAuthUser.id });

      studySessionRepositoryMock.findByIdWithOwner.mockResolvedValue(session);
      studySessionRepositoryMock.delete.mockRejectedValue(new Error("db error"));

      const promise = service.delete(userAuthUser, session.id);

      await expect(promise).rejects.toThrow("db error");
      expect(studySessionRepositoryMock.delete).toHaveBeenCalledTimes(1);
    });

  });

});