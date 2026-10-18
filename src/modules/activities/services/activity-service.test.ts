import { ForbiddenError } from "../../../shared/errors/forbidden.error";
import { NotFoundError } from "../../../shared/errors/not-found-error";
import { ValidationError } from "../../../shared/errors/validation-error";
import type { IOwnershipService } from "../../../shared/ownership/ownership-service.interface";
import type { IScopeService } from "../../../shared/scope/scope-service.interface";
import type { AuthUserDTO } from "../../../shared/DTOs/auth-user.DTO";
import type { IQuestionRepository } from "../../questions/interfaces/repositories/question-repository.interface";
import type { IActivityRepository } from "../interfaces/repositories/activity-repository.interface";
import type { Activity } from "@prisma/client";
import { makeQuestion, makeQuestionOption } from "../../../tests/factories/make-question";
import { makeActivity, makeActivityAttempt, makeActivityWithQuestions, makeActivityWithStats, makeAttemptWithAnswers } from "../../../tests/factories/make-activity";
import { ActivityService, MAX_QUESTIONS_PER_ACTIVITY } from "./activity.service";

describe("ActivityService", () => {

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

  const questionRepositoryMock: jest.Mocked<IQuestionRepository> = {
    create: jest.fn(),
    findById: jest.fn(),
    findAllByUserId: jest.fn(),
    findManyByIds: jest.fn(),
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

  const service = new ActivityService(activityRepositoryMock, questionRepositoryMock, ownershipMock, scopeServiceMock);

  const courseScope = { courseId: "course-id", moduleId: null, disciplineId: null };

  // simula o carregamento dos dados exibidos após criar/editar (getDetail)
  const mockDetail = (activity: Activity, questions = [makeQuestion()]) => {
    activityRepositoryMock.findByIdWithStats.mockResolvedValue(makeActivityWithStats({ ...activity, _count: { questions: questions.length, attempts: 0 } }));
    activityRepositoryMock.findByIdWithQuestions.mockResolvedValue(makeActivityWithQuestions(activity, questions));
  };

  beforeEach(() => {
    jest.clearAllMocks();
    ownershipMock.resolveOwnerId.mockResolvedValue(userAuthUser.id);
    scopeServiceMock.normalize.mockReturnValue(courseScope);
    scopeServiceMock.resolveOwned.mockResolvedValue({ courseId: "course-id", moduleId: null, disciplineId: null, ownerId: userAuthUser.id });
    scopeServiceMock.isWithin.mockReturnValue(true);
  });

  describe("create", () => {
    it("should create an activity with questions in scope", async () => {
      const activity = makeActivity({ userId: userAuthUser.id, ...courseScope });
      const questions = [makeQuestion({ userId: userAuthUser.id }), makeQuestion({ userId: userAuthUser.id })];
      questionRepositoryMock.findManyByIds.mockResolvedValue(questions);
      activityRepositoryMock.create.mockResolvedValue(activity);
      mockDetail(activity, questions);

      const result = await service.create(userAuthUser, {
        title: "  my activity ",
        description: "  ",
        courseId: "course-id",
        questionIds: questions.map(q => q.id),
      });

      expect(ownershipMock.resolveOwnerId).toHaveBeenCalledWith(userAuthUser, undefined);
      expect(scopeServiceMock.normalize).toHaveBeenCalledWith(expect.objectContaining({ courseId: "course-id" }), true);
      expect(questionRepositoryMock.findManyByIds).toHaveBeenCalledWith(questions.map(q => q.id), userAuthUser.id);
      expect(scopeServiceMock.resolveOwned).toHaveBeenCalledTimes(1 + questions.length);
      expect(scopeServiceMock.isWithin).toHaveBeenCalledTimes(questions.length);
      expect(activityRepositoryMock.create).toHaveBeenCalledWith({
        userId: userAuthUser.id,
        title: "my activity",
        description: null,
        ...courseScope,
      });
      expect(activityRepositoryMock.setQuestions).toHaveBeenCalledWith(activity.id, questions.map(q => q.id));
      expect(result.id).toBe(activity.id);
      expect(result.questionCount).toBe(2);
      expect(result.questions[0]!.options[0]).toHaveProperty("isCorrect");
    });

    it("should create an activity without questions", async () => {
      const activity = makeActivity({ userId: userAuthUser.id });
      activityRepositoryMock.create.mockResolvedValue(activity);
      mockDetail(activity, []);

      const result = await service.create(userAuthUser, { title: "t", courseId: "course-id" });

      expect(questionRepositoryMock.findManyByIds).not.toHaveBeenCalled();
      expect(activityRepositoryMock.setQuestions).toHaveBeenCalledWith(activity.id, []);
      expect(result.questionCount).toBe(0);
    });

    it("should throw ValidationError when question ids are repeated", async () => {
      const promise = service.create(userAuthUser, { title: "t", courseId: "course-id", questionIds: ["q1", "q1"] });

      await expect(promise).rejects.toThrow("Há questões repetidas na atividade");
      expect(activityRepositoryMock.create).not.toHaveBeenCalled();
    });

    it("should throw ValidationError when there are too many questions", async () => {
      const questionIds = Array.from({ length: MAX_QUESTIONS_PER_ACTIVITY + 1 }, (_, index) => `q${index}`);

      await expect(service.create(userAuthUser, { title: "t", courseId: "course-id", questionIds })).rejects.toThrow(ValidationError);
      expect(questionRepositoryMock.findManyByIds).not.toHaveBeenCalled();
    });

    it("should throw NotFoundError when some question is not found (or belongs to another user)", async () => {
      questionRepositoryMock.findManyByIds.mockResolvedValue([makeQuestion({ userId: userAuthUser.id })]);

      const promise = service.create(userAuthUser, { title: "t", courseId: "course-id", questionIds: ["q1", "q2"] });

      await expect(promise).rejects.toThrow(NotFoundError);
      expect(activityRepositoryMock.create).not.toHaveBeenCalled();
    });

    it("should throw ValidationError when a question is outside the activity scope", async () => {
      const question = makeQuestion({ userId: userAuthUser.id, statement: "Question from another course" });
      questionRepositoryMock.findManyByIds.mockResolvedValue([question]);
      scopeServiceMock.isWithin.mockReturnValue(false);

      const promise = service.create(userAuthUser, { title: "t", courseId: "course-id", questionIds: [question.id] });

      await expect(promise).rejects.toThrow('A questão "Question from another course" não pertence ao escopo da atividade');
      expect(scopeServiceMock.isWithin).toHaveBeenCalledWith(expect.objectContaining({ courseId: "course-id" }), courseScope);
      expect(activityRepositoryMock.create).not.toHaveBeenCalled();
    });

    it("should throw ValidationError when a question has no scope", async () => {
      const question = makeQuestion({ userId: userAuthUser.id, courseId: null });
      questionRepositoryMock.findManyByIds.mockResolvedValue([question]);
      scopeServiceMock.resolveOwned
        .mockResolvedValueOnce({ courseId: "course-id", moduleId: null, disciplineId: null, ownerId: userAuthUser.id })
        .mockResolvedValueOnce(null);

      await expect(service.create(userAuthUser, { title: "t", courseId: "course-id", questionIds: [question.id] })).rejects.toThrow(ValidationError);
      expect(activityRepositoryMock.create).not.toHaveBeenCalled();
    });

    it("should propagate ForbiddenError when activity scope belongs to another user", async () => {
      scopeServiceMock.resolveOwned.mockRejectedValue(new ForbiddenError());

      await expect(service.create(userAuthUser, { title: "t", courseId: "course-id" })).rejects.toThrow(ForbiddenError);
      expect(activityRepositoryMock.create).not.toHaveBeenCalled();
    });
  });

  describe("findById", () => {
    it("should return activity detail", async () => {
      const activity = makeActivity({ userId: userAuthUser.id });
      activityRepositoryMock.findById.mockResolvedValue(activity);
      mockDetail(activity);

      const result = await service.findById(userAuthUser, activity.id);

      expect(ownershipMock.validateOwnership).toHaveBeenCalledWith(userAuthUser, userAuthUser.id);
      expect(result?.id).toBe(activity.id);
    });

    it("should return null when activity does not exist", async () => {
      activityRepositoryMock.findById.mockResolvedValue(null);

      await expect(service.findById(userAuthUser, "missing")).resolves.toBeNull();
      expect(activityRepositoryMock.findByIdWithStats).not.toHaveBeenCalled();
    });

    it("should throw NotFoundError when detail cannot be loaded", async () => {
      activityRepositoryMock.findById.mockResolvedValue(makeActivity({ userId: userAuthUser.id }));
      activityRepositoryMock.findByIdWithStats.mockResolvedValue(null);
      activityRepositoryMock.findByIdWithQuestions.mockResolvedValue(null);

      await expect(service.findById(userAuthUser, "id")).rejects.toThrow(NotFoundError);
    });
  });

  describe("findAllByUserId", () => {
    it("should map stats (best score, last score and attempts)", async () => {
      const lastFinished = new Date("2026-02-02T10:00:00Z");
      const activity = makeActivityWithStats({
        userId: userAuthUser.id,
        _count: { questions: 3, attempts: 2 },
        attempts: [{ score: 40, finishedAt: lastFinished }, { score: 90, finishedAt: new Date("2026-02-01T10:00:00Z") }],
      });
      activityRepositoryMock.findAllByUserId.mockResolvedValue([activity]);

      const [result] = await service.findAllByUserId(userAuthUser, userAuthUser.id);

      expect(ownershipMock.validateOwnership).toHaveBeenCalledWith(userAuthUser, userAuthUser.id);
      expect(result).toEqual(expect.objectContaining({
        id: activity.id,
        questionCount: 3,
        attemptCount: 2,
        bestScore: 90,
        lastScore: 40,
        lastAttemptAt: lastFinished.toISOString(),
      }));
    });

    it("should return null scores when there are no attempts", async () => {
      activityRepositoryMock.findAllByUserId.mockResolvedValue([makeActivityWithStats()]);

      const [result] = await service.findAllByUserId(userAuthUser, userAuthUser.id);

      expect(result).toEqual(expect.objectContaining({ bestScore: null, lastScore: null, lastAttemptAt: null }));
    });

    it("should not query when ownership fails", async () => {
      ownershipMock.validateOwnership.mockImplementationOnce(() => { throw new ForbiddenError() });

      await expect(service.findAllByUserId(userAuthUser, "other")).rejects.toThrow(ForbiddenError);
      expect(activityRepositoryMock.findAllByUserId).not.toHaveBeenCalled();
    });
  });

  describe("update", () => {
    it("should update title and description", async () => {
      const activity = makeActivity({ userId: userAuthUser.id });
      activityRepositoryMock.findById.mockResolvedValue(activity);
      mockDetail(activity);

      await service.update(userAuthUser, activity.id, { title: " new ", description: " desc " });

      expect(activityRepositoryMock.update).toHaveBeenCalledWith(activity.id, { title: "new", description: "desc" });
    });

    it("should send only informed fields", async () => {
      const activity = makeActivity({ userId: userAuthUser.id });
      activityRepositoryMock.findById.mockResolvedValue(activity);
      mockDetail(activity);

      await service.update(userAuthUser, activity.id, { description: null });

      expect(activityRepositoryMock.update).toHaveBeenCalledWith(activity.id, { description: null });
    });

    it("should throw NotFoundError when activity does not exist", async () => {
      activityRepositoryMock.findById.mockResolvedValue(null);

      await expect(service.update(userAuthUser, "missing", { title: "t" })).rejects.toThrow("Atividade não encontrada");
      expect(activityRepositoryMock.update).not.toHaveBeenCalled();
    });

    it("should not update when ownership fails", async () => {
      activityRepositoryMock.findById.mockResolvedValue(makeActivity({ userId: "other" }));
      ownershipMock.validateOwnership.mockImplementationOnce(() => { throw new ForbiddenError() });

      await expect(service.update(userAuthUser, "id", { title: "t" })).rejects.toThrow(ForbiddenError);
      expect(activityRepositoryMock.update).not.toHaveBeenCalled();
    });
  });

  describe("setQuestions", () => {
    it("should validate questions against the activity owner and scope", async () => {
      const activity = makeActivity({ userId: "owner-id", courseId: null, moduleId: "module-id", disciplineId: null });
      const question = makeQuestion({ userId: "owner-id" });
      activityRepositoryMock.findById.mockResolvedValue(activity);
      questionRepositoryMock.findManyByIds.mockResolvedValue([question]);
      mockDetail(activity, [question]);

      await service.setQuestions(adminAuthUser, activity.id, [question.id]);

      expect(ownershipMock.validateOwnership).toHaveBeenCalledWith(adminAuthUser, "owner-id");
      expect(questionRepositoryMock.findManyByIds).toHaveBeenCalledWith([question.id], "owner-id");
      expect(scopeServiceMock.resolveOwned).toHaveBeenCalledWith(question, "owner-id");
      expect(scopeServiceMock.isWithin).toHaveBeenCalledWith(expect.anything(), activity);
      expect(activityRepositoryMock.setQuestions).toHaveBeenCalledWith(activity.id, [question.id]);
    });

    it("should allow clearing the questions", async () => {
      const activity = makeActivity({ userId: userAuthUser.id });
      activityRepositoryMock.findById.mockResolvedValue(activity);
      mockDetail(activity, []);

      await service.setQuestions(userAuthUser, activity.id, []);

      expect(questionRepositoryMock.findManyByIds).not.toHaveBeenCalled();
      expect(activityRepositoryMock.setQuestions).toHaveBeenCalledWith(activity.id, []);
    });

    it("should not set questions outside the scope", async () => {
      const activity = makeActivity({ userId: userAuthUser.id });
      activityRepositoryMock.findById.mockResolvedValue(activity);
      questionRepositoryMock.findManyByIds.mockResolvedValue([makeQuestion({ userId: userAuthUser.id })]);
      scopeServiceMock.isWithin.mockReturnValue(false);

      await expect(service.setQuestions(userAuthUser, activity.id, ["q1"])).rejects.toThrow(ValidationError);
      expect(activityRepositoryMock.setQuestions).not.toHaveBeenCalled();
    });

    it("should throw NotFoundError when activity does not exist", async () => {
      activityRepositoryMock.findById.mockResolvedValue(null);

      await expect(service.setQuestions(userAuthUser, "missing", [])).rejects.toThrow(NotFoundError);
    });
  });

  describe("softDelete", () => {
    it("should soft delete an owned activity", async () => {
      const activity = makeActivity({ userId: userAuthUser.id });
      activityRepositoryMock.findById.mockResolvedValue(activity);

      await service.softDelete(userAuthUser, activity.id);

      expect(ownershipMock.validateOwnership).toHaveBeenCalledWith(userAuthUser, userAuthUser.id);
      expect(activityRepositoryMock.softDelete).toHaveBeenCalledWith(activity.id);
    });

    it("should be idempotent when activity does not exist", async () => {
      activityRepositoryMock.findById.mockResolvedValue(null);

      await expect(service.softDelete(userAuthUser, "missing")).resolves.toBeUndefined();
      expect(activityRepositoryMock.softDelete).not.toHaveBeenCalled();
    });

    it("should not delete when ownership fails", async () => {
      activityRepositoryMock.findById.mockResolvedValue(makeActivity({ userId: "other" }));
      ownershipMock.validateOwnership.mockImplementationOnce(() => { throw new ForbiddenError() });

      await expect(service.softDelete(userAuthUser, "id")).rejects.toThrow(ForbiddenError);
      expect(activityRepositoryMock.softDelete).not.toHaveBeenCalled();
    });
  });

  describe("getForAnswering", () => {
    it("should return questions without correct answers and explanation", async () => {
      const activity = makeActivity({ userId: userAuthUser.id });
      const question = makeQuestion({ explanation: "secret" });
      activityRepositoryMock.findByIdWithQuestions.mockResolvedValue(makeActivityWithQuestions(activity, [question]));

      const result = await service.getForAnswering(userAuthUser, activity.id);

      expect(ownershipMock.validateStrictOwnership).toHaveBeenCalledWith(userAuthUser, userAuthUser.id);
      expect(ownershipMock.validateOwnership).not.toHaveBeenCalled();
      expect(result.id).toBe(activity.id);
      expect(result.questions).toHaveLength(1);
      expect(result.questions[0]!.explanation).toBeNull();
      result.questions[0]!.options.forEach(option => {
        expect(option).not.toHaveProperty("isCorrect");
      });
      expect(JSON.stringify(result)).not.toContain("isCorrect");
    });

    it("should use strict ownership (ADMIN cannot answer another user's activity)", async () => {
      const activity = makeActivity({ userId: userAuthUser.id });
      activityRepositoryMock.findByIdWithQuestions.mockResolvedValue(makeActivityWithQuestions(activity, [makeQuestion()]));
      ownershipMock.validateStrictOwnership.mockImplementationOnce(() => { throw new ForbiddenError() });

      await expect(service.getForAnswering(adminAuthUser, activity.id)).rejects.toThrow(ForbiddenError);
      expect(ownershipMock.validateStrictOwnership).toHaveBeenCalledWith(adminAuthUser, userAuthUser.id);
    });

    it("should throw NotFoundError when activity does not exist", async () => {
      activityRepositoryMock.findByIdWithQuestions.mockResolvedValue(null);

      await expect(service.getForAnswering(userAuthUser, "missing")).rejects.toThrow(NotFoundError);
    });

    it("should throw ValidationError when activity has no questions", async () => {
      activityRepositoryMock.findByIdWithQuestions.mockResolvedValue(makeActivityWithQuestions(makeActivity({ userId: userAuthUser.id }), []));

      await expect(service.getForAnswering(userAuthUser, "id")).rejects.toThrow("A atividade não possui questões");
    });
  });

  describe("submitAttempt", () => {
    const buildQuestion = (id: string) => makeQuestion({
      id,
      options: [
        makeQuestionOption({ id: `${id}-correct`, questionId: id, isCorrect: true, order: 0 }),
        makeQuestionOption({ id: `${id}-wrong`, questionId: id, isCorrect: false, order: 1 }),
      ],
    });

    const q1 = buildQuestion("q1");
    const q2 = buildQuestion("q2");
    const q3 = buildQuestion("q3");
    const activity = makeActivity({ id: "activity-id", userId: userAuthUser.id });

    beforeEach(() => {
      activityRepositoryMock.findByIdWithQuestions.mockResolvedValue(makeActivityWithQuestions(activity, [q1, q2, q3]));
      activityRepositoryMock.createAttempt.mockResolvedValue(makeActivityAttempt({ id: "attempt-id", activityId: activity.id }));
      activityRepositoryMock.findAttemptById.mockResolvedValue(makeAttemptWithAnswers({ id: "attempt-id", activityId: activity.id }));
    });

    it("should score the attempt (correct, wrong and unanswered questions)", async () => {
      await service.submitAttempt(userAuthUser, activity.id, {
        answers: [
          { questionId: "q1", optionId: "q1-correct" },
          { questionId: "q2", optionId: "q2-wrong" },
        ],
      });

      expect(ownershipMock.validateStrictOwnership).toHaveBeenCalledWith(userAuthUser, userAuthUser.id);
      expect(activityRepositoryMock.createAttempt).toHaveBeenCalledWith(expect.objectContaining({
        activityId: activity.id,
        userId: userAuthUser.id,
        correctCount: 1,
        totalQuestions: 3,
        score: 33.33,
        answers: [
          { questionId: "q1", selectedOptionId: "q1-correct", isCorrect: true },
          { questionId: "q2", selectedOptionId: "q2-wrong", isCorrect: false },
          { questionId: "q3", selectedOptionId: null, isCorrect: false },
        ],
      }));
      expect(activityRepositoryMock.findAttemptById).toHaveBeenCalledWith("attempt-id");
    });

    it("should give 100 when all answers are correct", async () => {
      await service.submitAttempt(userAuthUser, activity.id, {
        answers: [
          { questionId: "q1", optionId: "q1-correct" },
          { questionId: "q2", optionId: "q2-correct" },
          { questionId: "q3", optionId: "q3-correct" },
        ],
      });

      expect(activityRepositoryMock.createAttempt).toHaveBeenCalledWith(expect.objectContaining({ correctCount: 3, score: 100 }));
    });

    it("should give 0 when nothing is answered", async () => {
      await service.submitAttempt(userAuthUser, activity.id, { answers: [] });

      expect(activityRepositoryMock.createAttempt).toHaveBeenCalledWith(expect.objectContaining({ correctCount: 0, totalQuestions: 3, score: 0 }));
    });

    it("should round the score to 2 decimals", async () => {
      await service.submitAttempt(userAuthUser, activity.id, {
        answers: [
          { questionId: "q1", optionId: "q1-correct" },
          { questionId: "q2", optionId: "q2-correct" },
        ],
      });

      expect(activityRepositoryMock.createAttempt).toHaveBeenCalledWith(expect.objectContaining({ correctCount: 2, score: 66.67 }));
    });

    it("should use the informed startedAt when valid", async () => {
      const startedAt = "2026-01-01T10:00:00.000Z";

      await service.submitAttempt(userAuthUser, activity.id, { startedAt, answers: [] });

      expect(activityRepositoryMock.createAttempt).toHaveBeenCalledWith(expect.objectContaining({ startedAt: new Date(startedAt) }));
    });

    it("should replace an invalid or future startedAt by now", async () => {
      const before = Date.now();

      await service.submitAttempt(userAuthUser, activity.id, { startedAt: "invalid", answers: [] });
      await service.submitAttempt(userAuthUser, activity.id, { startedAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(), answers: [] });

      const after = Date.now();
      activityRepositoryMock.createAttempt.mock.calls.forEach(([data]) => {
        expect(data.startedAt.getTime()).toBeGreaterThanOrEqual(before);
        expect(data.startedAt.getTime()).toBeLessThanOrEqual(after);
      });
    });

    it("should throw ValidationError when an answer is for a question outside the activity", async () => {
      const promise = service.submitAttempt(userAuthUser, activity.id, { answers: [{ questionId: "other-question", optionId: "x" }] });

      await expect(promise).rejects.toThrow("Resposta enviada para uma questão que não pertence à atividade");
      expect(activityRepositoryMock.createAttempt).not.toHaveBeenCalled();
    });

    it("should throw ValidationError when the option does not belong to the question", async () => {
      const promise = service.submitAttempt(userAuthUser, activity.id, { answers: [{ questionId: "q1", optionId: "q2-correct" }] });

      await expect(promise).rejects.toThrow("Alternativa inválida para a questão");
      expect(activityRepositoryMock.createAttempt).not.toHaveBeenCalled();
    });

    it("should use strict ownership (ADMIN cannot answer for another user)", async () => {
      ownershipMock.validateStrictOwnership.mockImplementationOnce(() => { throw new ForbiddenError() });

      await expect(service.submitAttempt(adminAuthUser, activity.id, { answers: [] })).rejects.toThrow(ForbiddenError);
      expect(ownershipMock.validateStrictOwnership).toHaveBeenCalledWith(adminAuthUser, userAuthUser.id);
      expect(activityRepositoryMock.createAttempt).not.toHaveBeenCalled();
    });

    it("should throw NotFoundError when activity does not exist", async () => {
      activityRepositoryMock.findByIdWithQuestions.mockResolvedValue(null);

      await expect(service.submitAttempt(userAuthUser, "missing", { answers: [] })).rejects.toThrow(NotFoundError);
    });

    it("should throw ValidationError when activity has no questions", async () => {
      activityRepositoryMock.findByIdWithQuestions.mockResolvedValue(makeActivityWithQuestions(activity, []));

      await expect(service.submitAttempt(userAuthUser, activity.id, { answers: [] })).rejects.toThrow("A atividade não possui questões");
      expect(activityRepositoryMock.createAttempt).not.toHaveBeenCalled();
    });

    it("should throw NotFoundError when created attempt cannot be loaded", async () => {
      activityRepositoryMock.findAttemptById.mockResolvedValue(null);

      await expect(service.submitAttempt(userAuthUser, activity.id, { answers: [] })).rejects.toThrow("Tentativa não encontrada");
    });

    it("should return the attempt with answers and correct options", async () => {
      const question = buildQuestion("q1");
      activityRepositoryMock.findAttemptById.mockResolvedValue(makeAttemptWithAnswers({
        id: "attempt-id",
        activityId: activity.id,
        activity: { id: activity.id, title: "My activity" },
        startedAt: new Date("2026-01-01T10:00:00Z"),
        finishedAt: new Date("2026-01-01T10:01:30Z"),
        answers: [{ id: "a1", attemptId: "attempt-id", questionId: "q1", selectedOptionId: "q1-wrong", isCorrect: false, question }],
      }));

      const result = await service.submitAttempt(userAuthUser, activity.id, { answers: [] });

      expect(result.activityTitle).toBe("My activity");
      expect(result.durationSeconds).toBe(90);
      expect(result.answers).toEqual([{
        questionId: "q1",
        statement: question.statement,
        explanation: question.explanation,
        selectedOptionId: "q1-wrong",
        correctOptionId: "q1-correct",
        isCorrect: false,
        options: [{ id: "q1-correct", text: question.options[0]!.text }, { id: "q1-wrong", text: question.options[1]!.text }],
      }]);
    });
  });

  describe("findAttempts", () => {
    it("should return mapped attempts without answers", async () => {
      const activity = makeActivity({ userId: userAuthUser.id });
      activityRepositoryMock.findById.mockResolvedValue(activity);
      activityRepositoryMock.findAttemptsByActivityId.mockResolvedValue([makeActivityAttempt({ activityId: activity.id })]);

      const result = await service.findAttempts(userAuthUser, activity.id);

      expect(ownershipMock.validateOwnership).toHaveBeenCalledWith(userAuthUser, userAuthUser.id);
      expect(activityRepositoryMock.findAttemptsByActivityId).toHaveBeenCalledWith(activity.id);
      expect(result).toHaveLength(1);
      expect(result[0]).not.toHaveProperty("answers");
      expect(result[0]!.durationSeconds).toBe(300);
    });

    it("should throw NotFoundError when activity does not exist", async () => {
      activityRepositoryMock.findById.mockResolvedValue(null);

      await expect(service.findAttempts(userAuthUser, "missing")).rejects.toThrow(NotFoundError);
    });
  });

  describe("findAttemptById", () => {
    it("should return the attempt", async () => {
      const attempt = makeAttemptWithAnswers({ userId: userAuthUser.id });
      activityRepositoryMock.findAttemptById.mockResolvedValue(attempt);

      const result = await service.findAttemptById(userAuthUser, attempt.id);

      expect(ownershipMock.validateOwnership).toHaveBeenCalledWith(userAuthUser, userAuthUser.id);
      expect(result?.id).toBe(attempt.id);
      expect(result?.answers).toEqual([]);
    });

    it("should return null when attempt does not exist", async () => {
      activityRepositoryMock.findAttemptById.mockResolvedValue(null);

      await expect(service.findAttemptById(userAuthUser, "missing")).resolves.toBeNull();
    });

    it("should never return a negative duration", async () => {
      activityRepositoryMock.findAttemptById.mockResolvedValue(makeAttemptWithAnswers({
        userId: userAuthUser.id,
        startedAt: new Date("2026-01-01T10:05:00Z"),
        finishedAt: new Date("2026-01-01T10:00:00Z"),
      }));

      const result = await service.findAttemptById(userAuthUser, "id");

      expect(result?.durationSeconds).toBe(0);
    });
  });
});
