import { ForbiddenError } from "../../../shared/errors/forbidden.error";
import { ValidationError } from "../../../shared/errors/validation-error";
import type { IOwnershipService } from "../../../shared/ownership/ownership-service.interface";
import type { AuthUserDTO } from "../../../shared/DTOs/auth-user.DTO";
import type { IStudySessionRepository } from "../../study-sessions/interfaces/repositories/study-session-repository.interface";
import type { ICourseRepository } from "../../courses/interfaces/repositories/course-repository.interface";
import type { IModuleRepository } from "../../modules/interfaces/repositories/module-repository.interface";
import type { IDisciplineRepository } from "../../disciplines/interfaces/repositories/discipline-repository.interface";
import type { IGoalRepository } from "../../goals/interfaces/repositories/goal-respository.interface";
import type { IActivityRepository } from "../../activities/interfaces/repositories/activity-repository.interface";
import { DateConvert } from "../../../shared/convert/utils/date-convert.utils";
import { makeStudySession } from "../../../tests/factories/make-study-session";
import { makeCourse } from "../../../tests/factories/make-course";
import { makeModule } from "../../../tests/factories/make-module";
import { makeDiscipline } from "../../../tests/factories/make-discipline";
import { makeGoal } from "../../../tests/factories/make-goal";
import { makeActivityAttempt } from "../../../tests/factories/make-activity";
import { StatsService } from "./stats.service";

describe("StatsService", () => {

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
    findActiveByUser: jest.fn(),
    findByGeneralScope: jest.fn(),
    findByCourseScope: jest.fn(),
    findByModuleScope: jest.fn(),
    findByDisciplineScope: jest.fn(),
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
    deleteAllByUserId: jest.fn(),
  };

  const activityRepositoryMock: jest.Mocked<IActivityRepository> = {
    create: jest.fn(),
    findById: jest.fn(),
    findByIdWithQuestions: jest.fn(),
    findAllByUserId: jest.fn(),
    findByIdWithStats: jest.fn(),
    update: jest.fn(),
    setQuestions: jest.fn(),
    softDelete: jest.fn(),
    createAttempt: jest.fn(),
    findAttemptById: jest.fn(),
    findAttemptsByActivityId: jest.fn(),
    findAttemptsByUserId: jest.fn(),
  };

  const ownershipMock: jest.Mocked<IOwnershipService> = {
    resolveOwnerId: jest.fn(),
    validateOwnership: jest.fn(),
    validateStrictOwnership: jest.fn(),
  };

  const userAuthUser: AuthUserDTO = { id: "user-id", role: "USER", sessionId: "default" };

  // "hoje" fixo: 10/03/2026
  const today = new Date(Date.UTC(2026, 2, 10));
  const day = (iso: string) => new Date(`${iso}T00:00:00.000Z`);

  const dateUtils = new DateConvert();

  const service = new StatsService(
    studySessionRepositoryMock,
    ownershipMock,
    dateUtils,
    courseRepositoryMock,
    moduleRepositoryMock,
    disciplineRepositoryMock,
    goalRepositoryMock,
    activityRepositoryMock
  );

  const session = (studiedAt: string, minutes: number, scope: { courseId?: string, moduleId?: string, disciplineId?: string } = {}) =>
    makeStudySession({ userId: userAuthUser.id, studiedAt: day(studiedAt), minutes, status: "COMPLETED", ...scope });

  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(dateUtils, "getCurrentDate").mockReturnValue(today);
    studySessionRepositoryMock.findByGeneralScope.mockResolvedValue([]);
    studySessionRepositoryMock.findByCourseScope.mockResolvedValue([]);
    studySessionRepositoryMock.findByModuleScope.mockResolvedValue([]);
    studySessionRepositoryMock.findByDisciplineScope.mockResolvedValue([]);
    courseRepositoryMock.findAllByUserId.mockResolvedValue([]);
    moduleRepositoryMock.findAllByUserId.mockResolvedValue([]);
    disciplineRepositoryMock.findAllByUserId.mockResolvedValue([]);
  });

  afterAll(() => {
    jest.restoreAllMocks();
  });

  describe("getTotalStudyTime", () => {
    it("should sum minutes of the general scope", async () => {
      studySessionRepositoryMock.findByGeneralScope.mockResolvedValue([session("2026-03-01", 30), session("2026-03-02", 45)]);

      const result = await service.getTotalStudyTime({ userId: userAuthUser.id, startDate: day("2026-03-01"), endDate: day("2026-03-05") });

      expect(studySessionRepositoryMock.findByGeneralScope).toHaveBeenCalledWith(userAuthUser.id, day("2026-03-01"), day("2026-03-05"));
      expect(result).toBe(75);
    });

    it("should query by the informed scope", async () => {
      const startDate = day("2026-03-01");

      await service.getTotalStudyTime({ userId: "u", startDate, courseId: "c" });
      await service.getTotalStudyTime({ userId: "u", startDate, moduleId: "m" });
      await service.getTotalStudyTime({ userId: "u", startDate, disciplineId: "d" });

      expect(studySessionRepositoryMock.findByCourseScope).toHaveBeenCalledWith("u", "c", startDate, undefined);
      expect(studySessionRepositoryMock.findByModuleScope).toHaveBeenCalledWith("u", "m", startDate, undefined);
      expect(studySessionRepositoryMock.findByDisciplineScope).toHaveBeenCalledWith("u", "d", startDate, undefined);
      expect(studySessionRepositoryMock.findByGeneralScope).not.toHaveBeenCalled();
    });

    it("should return 0 when there are no sessions", async () => {
      await expect(service.getTotalStudyTime({ userId: "u", startDate: today })).resolves.toBe(0);
    });
  });

  describe("getStudyTimePerDay", () => {
    it("should fill days without study with zero and sum sessions of the same day", async () => {
      studySessionRepositoryMock.findByGeneralScope.mockResolvedValue([
        session("2026-03-01", 30),
        session("2026-03-01", 15),
        session("2026-03-03", 60),
      ]);

      const result = await service.getStudyTimePerDay({ userId: userAuthUser.id, startDate: day("2026-03-01"), endDate: day("2026-03-04") });

      expect(result).toEqual([
        { date: "2026-03-01", minutes: 45 },
        { date: "2026-03-02", minutes: 0 },
        { date: "2026-03-03", minutes: 60 },
        { date: "2026-03-04", minutes: 0 },
      ]);
    });

    it("should use today as end date when it is not informed", async () => {
      const result = await service.getStudyTimePerDay({ userId: userAuthUser.id, startDate: day("2026-03-08") });

      expect(result.map(item => item.date)).toEqual(["2026-03-08", "2026-03-09", "2026-03-10"]);
    });

    it("should normalize dates with time to the day", async () => {
      studySessionRepositoryMock.findByGeneralScope.mockResolvedValue([
        makeStudySession({ studiedAt: new Date("2026-03-02T15:30:00Z"), minutes: 20 }),
      ]);

      const result = await service.getStudyTimePerDay({
        userId: userAuthUser.id,
        startDate: new Date("2026-03-01T12:00:00Z"),
        endDate: new Date("2026-03-02T23:00:00Z"),
      });

      expect(result).toEqual([{ date: "2026-03-01", minutes: 0 }, { date: "2026-03-02", minutes: 20 }]);
    });
  });

  describe("getStudyTimeByScope", () => {
    const course1 = makeCourse({ id: "course-1", userId: userAuthUser.id, title: "Course 1" });
    const course2 = makeCourse({ id: "course-2", userId: userAuthUser.id, title: "Course 2" });
    const module1 = { ...makeModule({ courseId: "course-1", title: "Module 1" }), id: "module-1" };
    const module2 = { ...makeModule({ courseId: "course-1", title: "Module 2" }), id: "module-2" };
    const discipline1 = makeDiscipline({ id: "discipline-1", moduleId: "module-1", title: "Discipline 1" });
    const discipline2 = makeDiscipline({ id: "discipline-2", moduleId: "module-1", title: "Discipline 2" });

    beforeEach(() => {
      courseRepositoryMock.findAllByUserId.mockResolvedValue([course1, course2]);
      moduleRepositoryMock.findAllByUserId.mockResolvedValue([module1, module2]);
      disciplineRepositoryMock.findAllByUserId.mockResolvedValue([discipline1, discipline2]);
    });

    it("should return an empty list without loading the hierarchy when there are no sessions", async () => {
      const result = await service.getStudyTimeByScope({ userId: userAuthUser.id, startDate: today });

      expect(result).toEqual([]);
      expect(courseRepositoryMock.findAllByUserId).not.toHaveBeenCalled();
    });

    it("should group by course in the general scope (resolving modules and disciplines), sorted by minutes", async () => {
      studySessionRepositoryMock.findByGeneralScope.mockResolvedValue([
        session("2026-03-01", 10, { courseId: "course-1" }),
        session("2026-03-01", 20, { moduleId: "module-2" }),
        session("2026-03-01", 30, { disciplineId: "discipline-1" }),
        session("2026-03-01", 100, { courseId: "course-2" }),
        session("2026-03-01", 5, { courseId: "deleted-course" }),
      ]);

      const result = await service.getStudyTimeByScope({ userId: userAuthUser.id, startDate: today });

      expect(courseRepositoryMock.findAllByUserId).toHaveBeenCalledWith(userAuthUser.id);
      expect(result).toEqual([
        { scopeId: "course-2", scope: "course", title: "Course 2", minutes: 100 },
        { scopeId: "course-1", scope: "course", title: "Course 1", minutes: 60 },
        { scopeId: "deleted-course", scope: "course", title: "Curso removido", minutes: 5 },
      ]);
    });

    it("should group by module inside a course, with course-level sessions as '(geral)'", async () => {
      studySessionRepositoryMock.findByCourseScope.mockResolvedValue([
        session("2026-03-01", 10, { courseId: "course-1" }),
        session("2026-03-01", 20, { moduleId: "module-2" }),
        session("2026-03-01", 30, { disciplineId: "discipline-1" }),
        session("2026-03-01", 15, { moduleId: "module-1" }),
      ]);

      const result = await service.getStudyTimeByScope({ userId: userAuthUser.id, startDate: today, courseId: "course-1" });

      expect(result).toEqual([
        { scopeId: "module-1", scope: "module", title: "Module 1", minutes: 45 },
        { scopeId: "module-2", scope: "module", title: "Module 2", minutes: 20 },
        { scopeId: "course-1", scope: "course", title: "Course 1 (geral)", minutes: 10 },
      ]);
    });

    it("should group by discipline inside a module, with module-level sessions as '(geral)'", async () => {
      studySessionRepositoryMock.findByModuleScope.mockResolvedValue([
        session("2026-03-01", 10, { moduleId: "module-1" }),
        session("2026-03-01", 30, { disciplineId: "discipline-1" }),
        session("2026-03-02", 30, { disciplineId: "discipline-1" }),
        session("2026-03-01", 25, { disciplineId: "discipline-2" }),
      ]);

      const result = await service.getStudyTimeByScope({ userId: userAuthUser.id, startDate: today, moduleId: "module-1" });

      expect(result).toEqual([
        { scopeId: "discipline-1", scope: "discipline", title: "Discipline 1", minutes: 60 },
        { scopeId: "discipline-2", scope: "discipline", title: "Discipline 2", minutes: 25 },
        { scopeId: "module-1", scope: "module", title: "Module 1 (geral)", minutes: 10 },
      ]);
    });

    it("should group by discipline when filtering by discipline", async () => {
      studySessionRepositoryMock.findByDisciplineScope.mockResolvedValue([session("2026-03-01", 30, { disciplineId: "discipline-2" })]);

      const result = await service.getStudyTimeByScope({ userId: userAuthUser.id, startDate: today, disciplineId: "discipline-2" });

      expect(result).toEqual([{ scopeId: "discipline-2", scope: "discipline", title: "Discipline 2", minutes: 30 }]);
    });
  });

  describe("getSummary", () => {
    it("should use the last 30 days by default and compute totals and streak", async () => {
      studySessionRepositoryMock.findByGeneralScope.mockResolvedValue([
        session("2026-02-10", 60),
        session("2026-03-07", 30),
        session("2026-03-08", 30),
        session("2026-03-09", 30),
      ]);

      const result = await service.getSummary(userAuthUser, { userId: userAuthUser.id });

      expect(ownershipMock.validateOwnership).toHaveBeenCalledWith(userAuthUser, userAuthUser.id);
      expect(studySessionRepositoryMock.findByGeneralScope).toHaveBeenCalledWith(userAuthUser.id, day("2026-02-09"), today);
      expect(result.startDate).toBe("2026-02-09T00:00:00.000Z");
      expect(result.endDate).toBe("2026-03-10T00:00:00.000Z");
      expect(result.perDay).toHaveLength(30);
      expect(result.totalMinutes).toBe(150);
      expect(result.sessionsCount).toBe(4);
      expect(result.studiedDays).toBe(4);
      expect(result.averageMinutesPerDay).toBe(5);
      // hoje (10/03) ainda sem estudo não quebra a sequência
      expect(result.currentStreak).toBe(3);
    });

    it("should count today in the streak and stop at the first day without study", async () => {
      studySessionRepositoryMock.findByGeneralScope.mockResolvedValue([
        session("2026-03-06", 30),
        session("2026-03-08", 30),
        session("2026-03-09", 30),
        session("2026-03-10", 30),
      ]);

      const result = await service.getSummary(userAuthUser, { userId: userAuthUser.id, startDate: "01/03/2026", endDate: "10/03/2026" });

      expect(result.perDay).toHaveLength(10);
      expect(result.currentStreak).toBe(3);
    });

    it("should return zero streak when the day before the end has no study", async () => {
      studySessionRepositoryMock.findByGeneralScope.mockResolvedValue([session("2026-03-05", 30)]);

      const result = await service.getSummary(userAuthUser, { userId: userAuthUser.id, startDate: "01/03/2026" });

      expect(result.currentStreak).toBe(0);
    });

    it("should pass the scope filter and include byScope", async () => {
      courseRepositoryMock.findAllByUserId.mockResolvedValue([makeCourse({ id: "course-1", title: "Course 1" })]);
      studySessionRepositoryMock.findByCourseScope.mockResolvedValue([session("2026-03-09", 40, { courseId: "course-1" })]);

      const result = await service.getSummary(userAuthUser, { userId: userAuthUser.id, courseId: "course-1" });

      expect(studySessionRepositoryMock.findByCourseScope).toHaveBeenCalledWith(userAuthUser.id, "course-1", expect.any(Date), today);
      expect(result.byScope).toEqual([{ scopeId: "course-1", scope: "course", title: "Course 1 (geral)", minutes: 40 }]);
    });

    it("should throw ValidationError when start date is after end date", async () => {
      await expect(service.getSummary(userAuthUser, { userId: userAuthUser.id, startDate: "10/03/2026", endDate: "01/03/2026" }))
        .rejects.toThrow("A data inicial não pode ser maior que a data final");
    });

    it("should throw ValidationError when the period is longer than 2 years", async () => {
      await expect(service.getSummary(userAuthUser, { userId: userAuthUser.id, startDate: "01/01/2020", endDate: "10/03/2026" }))
        .rejects.toThrow(ValidationError);
    });

    it("should not query sessions when ownership fails", async () => {
      ownershipMock.validateOwnership.mockImplementationOnce(() => { throw new ForbiddenError() });

      await expect(service.getSummary(userAuthUser, { userId: "other" })).rejects.toThrow(ForbiddenError);
      expect(studySessionRepositoryMock.findByGeneralScope).not.toHaveBeenCalled();
    });
  });

  describe("getGoalsProgress", () => {
    const goalFor = (overrides: Parameters<typeof makeGoal>[0]) => makeGoal({ userId: userAuthUser.id, targetMinutes: 60, ...overrides });

    const progressOf = async (goal: ReturnType<typeof makeGoal>) => {
      goalRepositoryMock.findAllByUserId.mockResolvedValue([goal]);
      const [result] = await service.getGoalsProgress(userAuthUser, userAuthUser.id);
      return result!;
    };

    it("should validate ownership and load the user's goals", async () => {
      goalRepositoryMock.findAllByUserId.mockResolvedValue([]);

      await expect(service.getGoalsProgress(userAuthUser, userAuthUser.id)).resolves.toEqual([]);
      expect(ownershipMock.validateOwnership).toHaveBeenCalledWith(userAuthUser, userAuthUser.id);
      expect(goalRepositoryMock.findAllByUserId).toHaveBeenCalledWith(userAuthUser.id);
    });

    it("should return NOT_STARTED for goals starting in the future", async () => {
      const result = await progressOf(goalFor({ type: "TOTAL_BY_DATE", startDate: day("2026-03-11"), endDate: day("2026-03-20") }));

      expect(result).toEqual(expect.objectContaining({ status: "NOT_STARTED", studiedMinutes: 0, percent: 0 }));
      expect(studySessionRepositoryMock.findByGeneralScope).not.toHaveBeenCalled();
    });

    it("should map base fields and use the goal scope", async () => {
      const goal = goalFor({ type: "TOTAL_BY_DATE", startDate: day("2026-03-01"), endDate: null, courseId: "course-1" });

      const result = await progressOf(goal);

      expect(studySessionRepositoryMock.findByCourseScope).toHaveBeenCalledWith(userAuthUser.id, "course-1", day("2026-03-01"), today);
      expect(result).toEqual(expect.objectContaining({
        goalId: goal.id,
        title: goal.title,
        type: "TOTAL_BY_DATE",
        targetMinutes: 60,
        startDate: goal.startDate.toISOString(),
        endDate: null,
        scope: { courseId: "course-1", moduleId: null, disciplineId: null },
      }));
    });

    describe("DAILY_ONCE", () => {
      it("should be IN_PROGRESS on the goal day while target is not reached", async () => {
        studySessionRepositoryMock.findByGeneralScope.mockResolvedValue([session("2026-03-10", 30)]);

        const result = await progressOf(goalFor({ type: "DAILY_ONCE", startDate: today, endDate: null }));

        expect(studySessionRepositoryMock.findByGeneralScope).toHaveBeenCalledWith(userAuthUser.id, today, today);
        expect(result).toEqual(expect.objectContaining({ status: "IN_PROGRESS", studiedMinutes: 30, percent: 50 }));
      });

      it("should be ACHIEVED when the target is reached", async () => {
        studySessionRepositoryMock.findByGeneralScope.mockResolvedValue([session("2026-03-05", 50), session("2026-03-05", 40)]);

        const result = await progressOf(goalFor({ type: "DAILY_ONCE", startDate: day("2026-03-05"), endDate: null }));

        expect(result).toEqual(expect.objectContaining({ status: "ACHIEVED", studiedMinutes: 90, percent: 100 }));
      });

      it("should be EXPIRED after the goal day without reaching the target", async () => {
        studySessionRepositoryMock.findByGeneralScope.mockResolvedValue([session("2026-03-05", 10)]);

        const result = await progressOf(goalFor({ type: "DAILY_ONCE", startDate: day("2026-03-05"), endDate: null }));

        expect(result).toEqual(expect.objectContaining({ status: "EXPIRED", studiedMinutes: 10, percent: 17 }));
      });
    });

    describe("DAILY_RECURRING", () => {
      it("should be ACHIEVED when today's target is reached (ongoing goal)", async () => {
        studySessionRepositoryMock.findByGeneralScope.mockResolvedValue([session("2026-03-08", 60), session("2026-03-10", 60)]);

        const result = await progressOf(goalFor({ type: "DAILY_RECURRING", startDate: day("2026-03-08"), endDate: null }));

        expect(studySessionRepositoryMock.findByGeneralScope).toHaveBeenCalledWith(userAuthUser.id, day("2026-03-08"), today);
        expect(result).toEqual(expect.objectContaining({
          status: "ACHIEVED",
          studiedMinutes: 60,
          percent: 100,
          daysAchieved: 2,
          totalDays: 3,
        }));
      });

      it("should be IN_PROGRESS when today's target is not reached yet", async () => {
        studySessionRepositoryMock.findByGeneralScope.mockResolvedValue([session("2026-03-09", 90), session("2026-03-10", 15)]);

        const result = await progressOf(goalFor({ type: "DAILY_RECURRING", startDate: day("2026-03-09"), endDate: day("2026-03-20") }));

        expect(result).toEqual(expect.objectContaining({
          status: "IN_PROGRESS",
          studiedMinutes: 15,
          percent: 25,
          daysAchieved: 1,
          totalDays: 2,
        }));
      });

      it("should be ACHIEVED after the end date when every day reached the target", async () => {
        studySessionRepositoryMock.findByGeneralScope.mockResolvedValue([
          session("2026-03-01", 60),
          session("2026-03-02", 70),
          session("2026-03-03", 60),
        ]);

        const result = await progressOf(goalFor({ type: "DAILY_RECURRING", startDate: day("2026-03-01"), endDate: day("2026-03-03") }));

        expect(studySessionRepositoryMock.findByGeneralScope).toHaveBeenCalledWith(userAuthUser.id, day("2026-03-01"), day("2026-03-03"));
        expect(result).toEqual(expect.objectContaining({
          status: "ACHIEVED",
          studiedMinutes: 190,
          percent: 100,
          daysAchieved: 3,
          totalDays: 3,
        }));
      });

      it("should be EXPIRED after the end date when some day missed the target", async () => {
        studySessionRepositoryMock.findByGeneralScope.mockResolvedValue([session("2026-03-01", 60), session("2026-03-02", 10), session("2026-03-03", 60)]);

        const result = await progressOf(goalFor({ type: "DAILY_RECURRING", startDate: day("2026-03-01"), endDate: day("2026-03-03") }));

        expect(result).toEqual(expect.objectContaining({ status: "EXPIRED", studiedMinutes: 130, percent: 67, daysAchieved: 2, totalDays: 3 }));
      });
    });

    describe.each(["TOTAL_BY_DATE", "TOTAL_IN_PERIOD"] as const)("%s", (type) => {
      it("should be IN_PROGRESS while the total is not reached before the end date", async () => {
        studySessionRepositoryMock.findByGeneralScope.mockResolvedValue([session("2026-03-02", 20), session("2026-03-05", 10)]);

        const result = await progressOf(goalFor({ type, startDate: day("2026-03-01"), endDate: day("2026-03-31") }));

        expect(studySessionRepositoryMock.findByGeneralScope).toHaveBeenCalledWith(userAuthUser.id, day("2026-03-01"), today);
        expect(result).toEqual(expect.objectContaining({ status: "IN_PROGRESS", studiedMinutes: 30, percent: 50 }));
      });

      it("should be ACHIEVED when the total is reached (percent capped at 100)", async () => {
        studySessionRepositoryMock.findByGeneralScope.mockResolvedValue([session("2026-03-02", 100), session("2026-03-05", 50)]);

        const result = await progressOf(goalFor({ type, startDate: day("2026-03-01"), endDate: day("2026-03-31") }));

        expect(result).toEqual(expect.objectContaining({ status: "ACHIEVED", studiedMinutes: 150, percent: 100 }));
      });

      it("should be EXPIRED after the end date without reaching the total", async () => {
        studySessionRepositoryMock.findByGeneralScope.mockResolvedValue([session("2026-03-02", 20)]);

        const result = await progressOf(goalFor({ type, startDate: day("2026-03-01"), endDate: day("2026-03-05") }));

        expect(studySessionRepositoryMock.findByGeneralScope).toHaveBeenCalledWith(userAuthUser.id, day("2026-03-01"), day("2026-03-05"));
        expect(result).toEqual(expect.objectContaining({ status: "EXPIRED", studiedMinutes: 20, percent: 33 }));
      });

      it("should never expire when there is no end date", async () => {
        const result = await progressOf(goalFor({ type, startDate: day("2025-01-01"), endDate: null }));

        expect(result.status).toBe("IN_PROGRESS");
      });
    });

    it("should return 0 percent when target is zero", async () => {
      studySessionRepositoryMock.findByGeneralScope.mockResolvedValue([session("2026-03-02", 20)]);

      const result = await progressOf(goalFor({ type: "TOTAL_BY_DATE", targetMinutes: 0, startDate: day("2026-03-01"), endDate: null }));

      expect(result.percent).toBe(0);
    });
  });

  describe("getPerformance", () => {
    const attempt = (activityId: string, score: number, activity: { courseId?: string | null, moduleId?: string | null, disciplineId?: string | null } = {}) => ({
      ...makeActivityAttempt({ activityId, score, userId: userAuthUser.id }),
      activity: { id: activityId, title: `Activity ${activityId}`, courseId: null, moduleId: null, disciplineId: null, ...activity },
    });

    it("should compute totals, timeline and per activity stats", async () => {
      activityRepositoryMock.findAttemptsByUserId.mockResolvedValue([
        attempt("a1", 50),
        attempt("a2", 80),
        attempt("a1", 100),
      ]);

      const result = await service.getPerformance(userAuthUser, { userId: userAuthUser.id });

      expect(ownershipMock.validateOwnership).toHaveBeenCalledWith(userAuthUser, userAuthUser.id);
      expect(activityRepositoryMock.findAttemptsByUserId).toHaveBeenCalledWith(userAuthUser.id, undefined);
      expect(result.totalAttempts).toBe(3);
      expect(result.averageScore).toBe(76.67);
      expect(result.bestScore).toBe(100);
      expect(result.timeline.map(item => item.score)).toEqual([50, 80, 100]);
      expect(result.byActivity).toEqual([
        { activityId: "a1", title: "Activity a1", attempts: 2, averageScore: 75, bestScore: 100, lastScore: 100 },
        { activityId: "a2", title: "Activity a2", attempts: 1, averageScore: 80, bestScore: 80, lastScore: 80 },
      ]);
    });

    it("should pass the start date and filter by scope", async () => {
      activityRepositoryMock.findAttemptsByUserId.mockResolvedValue([
        attempt("a1", 50, { courseId: "course-1" }),
        attempt("a2", 80, { courseId: "course-2" }),
      ]);

      const result = await service.getPerformance(userAuthUser, { userId: userAuthUser.id, startDate: "01/03/2026", courseId: "course-1" });

      expect(activityRepositoryMock.findAttemptsByUserId).toHaveBeenCalledWith(userAuthUser.id, day("2026-03-01"));
      expect(result.totalAttempts).toBe(1);
      expect(result.byActivity.map(item => item.activityId)).toEqual(["a1"]);
    });

    it("should return nulls when there are no attempts", async () => {
      activityRepositoryMock.findAttemptsByUserId.mockResolvedValue([]);

      const result = await service.getPerformance(userAuthUser, { userId: userAuthUser.id });

      expect(result).toEqual({ totalAttempts: 0, averageScore: null, bestScore: null, timeline: [], byActivity: [] });
    });
  });
});
