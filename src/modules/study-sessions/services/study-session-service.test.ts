import { StudySessionService } from "./study-session.service";
import { AuthorizationError } from "../../../shared/errors/authorization.error";
import { NotFoundError } from "../../../shared/errors/not-found-error";
import { ValidationError } from "../../../shared/errors/validation-error";
import { makeStudySession } from "../../../tests/factories/make-study-session";
import { makeCourse } from "../../../tests/factories/make-course";
import type { IStudySessionRepository } from "../interfaces/repositories/study-session-repository.interface";
import type { IOwnershipService } from "../../../shared/ownership/ownership-service.interface";
import type { ICourseRepository } from "../../courses/interfaces/repositories/course-repository.interface";
import type { IDisciplineRepository } from "../../disciplines/interfaces/repositories/discipline-repository.interface";
import type { IModuleRepository } from "../../modules/interfaces/repositories/module-repository.interface";
import type { IDateConvert } from "../../../shared/convert/interfaces/date-convert.interface";
import type { AuthUserDTO } from "../../../shared/DTOs/auth-user.DTO";

describe("StudySessionService 100% coverage", () => {
  let service: StudySessionService;

  const sessionRepoMock: jest.Mocked<IStudySessionRepository> = {
    create: jest.fn(),
    findById: jest.fn(),
    findByIdWithOwner: jest.fn(),
    findAllByUserId: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  } as any;

  const ownershipMock: jest.Mocked<IOwnershipService> = {
    resolveOwnerId: jest.fn(),
    validateOwnership: jest.fn(),
    validateStrictOwnership: jest.fn(),
  };

  const courseRepoMock: jest.Mocked<ICourseRepository> = { findOwnedById: jest.fn() } as any;
  const moduleRepoMock: jest.Mocked<IModuleRepository> = { findByIdWithCourse: jest.fn() } as any;
  const disciplineRepoMock: jest.Mocked<IDisciplineRepository> = { findByIdWithCourse: jest.fn() } as any;
  const dateUtilsMock: jest.Mocked<IDateConvert> = { dateFormat: jest.fn(), getCurrentDate: jest.fn() } as any;

  const userAuth: AuthUserDTO = { id: "user-1", role: "USER", sessionId: "any" };
  const adminAuth: AuthUserDTO = { id: "admin-1", role: "ADMIN", sessionId: "any" };

  beforeEach(() => {
    jest.clearAllMocks();
    service = new StudySessionService(
      sessionRepoMock,
      ownershipMock,
      courseRepoMock,
      disciplineRepoMock,
      moduleRepoMock,
      dateUtilsMock
    );

    const now = new Date("2026-01-02T10:00:00Z");
    dateUtilsMock.getCurrentDate.mockReturnValue(now);
    dateUtilsMock.dateFormat.mockImplementation((d) => new Date(d));
  });

  // ---------------- CREATE ----------------
  describe("create", () => {
    it("should create session with courseId successfully", async () => {
      const course = makeCourse({ userId: userAuth.id });
      ownershipMock.resolveOwnerId.mockResolvedValue(userAuth.id);
      courseRepoMock.findOwnedById.mockResolvedValue(course);
      sessionRepoMock.create.mockResolvedValue(makeStudySession());

      await service.create(userAuth, { userId: userAuth.id, minutes: 10, courseId: course.id });

      expect(courseRepoMock.findOwnedById).toHaveBeenCalledWith(course.id, userAuth.id);
      expect(sessionRepoMock.create).toHaveBeenCalled();
    });

    it("should create session with moduleId successfully", async () => {
      const module = { id: "m1", course: { userId: userAuth.id } };
      ownershipMock.resolveOwnerId.mockResolvedValue(userAuth.id);
      moduleRepoMock.findByIdWithCourse.mockResolvedValue(module as any);
      sessionRepoMock.create.mockResolvedValue(makeStudySession());

      await service.create(userAuth, { userId: userAuth.id, minutes: 10, moduleId: "m1" });

      expect(moduleRepoMock.findByIdWithCourse).toHaveBeenCalledWith("m1");
      expect(sessionRepoMock.create).toHaveBeenCalled();
    });

    it("should create session with disciplineId successfully", async () => {
      const discipline = { id: "d1", module: { course: { userId: userAuth.id } } };
      ownershipMock.resolveOwnerId.mockResolvedValue(userAuth.id);
      disciplineRepoMock.findByIdWithCourse.mockResolvedValue(discipline as any);
      sessionRepoMock.create.mockResolvedValue(makeStudySession());

      await service.create(userAuth, { userId: userAuth.id, minutes: 10, disciplineId: "d1" });

      expect(disciplineRepoMock.findByIdWithCourse).toHaveBeenCalledWith("d1");
      expect(sessionRepoMock.create).toHaveBeenCalled();
    });

    it("should throw ValidationError if minutes <= 0", async () => {
      await expect(service.create(userAuth, { userId: userAuth.id, minutes: 0 }))
        .rejects.toThrow(ValidationError);
    });

    it("should throw ValidationError if studiedAt in future", async () => {
      dateUtilsMock.dateFormat.mockReturnValue(new Date("2030-01-01"));
      await expect(service.create(userAuth, { userId: userAuth.id, minutes: 10, studiedAt: "2030-01-01" }))
        .rejects.toThrow("Data estudada inválida");
    });

    it("should throw ValidationError if more than one scope provided", async () => {
      await expect(service.create(userAuth, { userId: userAuth.id, minutes: 10, courseId: "c1", moduleId: "m1" }))
        .rejects.toThrow("Sessão de estudo pode ter apenas um escopo");
    });

    it("should throw NotFoundError if moduleId does not exist", async () => {
      ownershipMock.resolveOwnerId.mockResolvedValue(userAuth.id);
      moduleRepoMock.findByIdWithCourse.mockResolvedValue(null);

      await expect(service.create(userAuth, { userId: userAuth.id, minutes: 10, moduleId: "m-nonexistent" }))
        .rejects.toThrow(NotFoundError);
    });

    it("should throw NotFoundError if disciplineId does not exist", async () => {
      ownershipMock.resolveOwnerId.mockResolvedValue(userAuth.id);
      disciplineRepoMock.findByIdWithCourse.mockResolvedValue(null);

      await expect(service.create(userAuth, { userId: userAuth.id, minutes: 10, disciplineId: "d-nonexistent" }))
        .rejects.toThrow(NotFoundError);
    });

    it("should throw AuthorizationError if module belongs to another user", async () => {
      ownershipMock.resolveOwnerId.mockResolvedValue(userAuth.id);
      moduleRepoMock.findByIdWithCourse.mockResolvedValue({ course: { userId: "other" } } as any);

      await expect(service.create(userAuth, { userId: userAuth.id, minutes: 10, moduleId: "m1" }))
        .rejects.toThrow(AuthorizationError);
    });

    it("should throw AuthorizationError if discipline belongs to another user", async () => {
      ownershipMock.resolveOwnerId.mockResolvedValue(userAuth.id);
      disciplineRepoMock.findByIdWithCourse.mockResolvedValue({ module: { course: { userId: "other" } } } as any);

      await expect(service.create(userAuth, { userId: userAuth.id, minutes: 10, disciplineId: "d1" }))
        .rejects.toThrow(AuthorizationError);
    });

    it("should use current date if studiedAt not provided", async () => {
      ownershipMock.resolveOwnerId.mockResolvedValue(userAuth.id);
      sessionRepoMock.create.mockResolvedValue(makeStudySession());

      await service.create(userAuth, { userId: userAuth.id, minutes: 10 });
      expect(dateUtilsMock.getCurrentDate).toHaveBeenCalled();
    });
  });

  // ---------------- FIND BY ID ----------------
  describe("findById", () => {
    it("should return null if session not found (USER)", async () => {
      sessionRepoMock.findByIdWithOwner.mockResolvedValue(null);
      const result = await service.findById(userAuth, "any-id");
      expect(result).toBeNull();
    });

    it("should call correct repo for ADMIN and USER", async () => {
      const session = makeStudySession({ userId: userAuth.id });
      sessionRepoMock.findById.mockResolvedValue(session);
      await service.findById(adminAuth, session.id);
      expect(sessionRepoMock.findById).toHaveBeenCalledWith(session.id);

      sessionRepoMock.findByIdWithOwner.mockResolvedValue(session);
      await service.findById(userAuth, session.id);
      expect(sessionRepoMock.findByIdWithOwner).toHaveBeenCalledWith(session.id, userAuth.id);
    });
  });

  // ---------------- UPDATE ----------------
  describe("update", () => {
    it("should update minutes and studiedAt successfully", async () => {
      const session = makeStudySession({ userId: userAuth.id, minutes: 10 });
      const newDate = new Date("2026-01-01");

      sessionRepoMock.findByIdWithOwner.mockResolvedValue(session);
      dateUtilsMock.dateFormat.mockReturnValue(newDate);
      sessionRepoMock.update.mockResolvedValue({ ...session, minutes: 20, studiedAt: newDate });

      const result = await service.update(userAuth, session.id, { minutes: 20, studiedAt: "2026-01-01" });
      expect(sessionRepoMock.update).toHaveBeenCalledWith(session.id, expect.objectContaining({ minutes: 20, studiedAt: newDate }));
      expect(result.minutes).toBe(20);
      expect(result.studiedAt).toEqual(newDate);
    });

    it("should throw NotFoundError if session does not exist", async () => {
      sessionRepoMock.findByIdWithOwner.mockResolvedValue(null);
      await expect(service.update(userAuth, "fake-id", { minutes: 10 })).rejects.toThrow(NotFoundError);
    });

    it("should throw ValidationError if studiedAt in future", async () => {
      const session = makeStudySession();
      sessionRepoMock.findByIdWithOwner.mockResolvedValue(session);
      dateUtilsMock.dateFormat.mockReturnValue(new Date("2030-01-01"));

      await expect(service.update(userAuth, session.id, { studiedAt: "2030-01-01" }))
        .rejects.toThrow("Data estudada inválida");
    });

    it("should throw ValidationError if minutes <= 0", async () => {
      const session = makeStudySession();
      sessionRepoMock.findByIdWithOwner.mockResolvedValue(session);
      await expect(service.update(userAuth, session.id, { minutes: 0 }))
        .rejects.toThrow(ValidationError);
    });
  });

  // ---------------- DELETE ----------------
  describe("delete", () => {
    it("should delete session if exists", async () => {
      const session = makeStudySession({ userId: userAuth.id });
      sessionRepoMock.findByIdWithOwner.mockResolvedValue(session);

      await service.delete(userAuth, session.id);
      expect(sessionRepoMock.delete).toHaveBeenCalledWith(session.id);
    });

    it("should return silently if session does not exist", async () => {
      sessionRepoMock.findByIdWithOwner.mockResolvedValue(null);
      await expect(service.delete(userAuth, "any-id")).resolves.not.toThrow();
      expect(sessionRepoMock.delete).not.toHaveBeenCalled();
    });
  });

  // ---------------- FIND ALL ----------------
  describe("findAllByUserId", () => {
    it("should return all sessions for authorized user", async () => {
      const sessions = [makeStudySession(), makeStudySession()];
      sessionRepoMock.findAllByUserId.mockResolvedValue(sessions);

      const result = await service.findAllByUserId(userAuth, userAuth.id);
      expect(ownershipMock.validateOwnership).toHaveBeenCalledWith(userAuth, userAuth.id);
      expect(result).toHaveLength(2);
    });
  });
});