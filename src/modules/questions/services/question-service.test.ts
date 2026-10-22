import { ForbiddenError } from "../../../shared/errors/forbidden.error";
import { NotFoundError } from "../../../shared/errors/not-found-error";
import { ValidationError } from "../../../shared/errors/validation-error";
import type { IOwnershipService } from "../../../shared/ownership/ownership-service.interface";
import type { IScopeService } from "../../../shared/scope/interfaces/scope-service.interface";
import type { AuthUserDTO } from "../../../shared/DTOs/auth-user.DTO";
import type { IQuestionRepository } from "../interfaces/repositories/question-repository.interface";
import type { ITransaction } from "../../transaction/interfaces/transaction.interface";
import type { IRepositories } from "../../transaction/interfaces/repositories.interface";
import { makeQuestion, makeQuestionOption } from "../../../tests/factories/make-question";
import { QuestionService } from "./question.service";

describe("QuestionService", () => {

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

  const transactionMock: jest.Mocked<ITransaction> = {
    execute: jest.fn().mockImplementation(async (work) => work({ questionRepository: questionRepositoryMock } as unknown as IRepositories)),
  };

  const adminAuthUser: AuthUserDTO = { id: "admin-id", role: "ADMIN", sessionId: "default" };
  const userAuthUser: AuthUserDTO = { id: "user-id", role: "USER", sessionId: "default" };

  const service = new QuestionService(questionRepositoryMock, ownershipMock, scopeServiceMock, transactionMock);

  const courseScope = { courseId: "course-id", moduleId: null, disciplineId: null };

  const validOptions = [
    { text: " Option A ", isCorrect: true },
    { text: "Option B", isCorrect: false },
    { text: "Option C", isCorrect: false },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    ownershipMock.resolveOwnerId.mockResolvedValue(userAuthUser.id);
    scopeServiceMock.normalize.mockReturnValue(courseScope);
    scopeServiceMock.resolveOwned.mockResolvedValue({ ...courseScope, courseId: "course-id", ownerId: userAuthUser.id });
  });

  describe("create", () => {
    it("should create a multiple choice question successfully", async () => {
      const question = makeQuestion({ userId: userAuthUser.id, courseId: "course-id" });
      questionRepositoryMock.create.mockResolvedValue(question);

      const result = await service.create(userAuthUser, {
        statement: "  What is 2 + 2?  ",
        type: "MULTIPLE_CHOICE",
        explanation: "  basic math  ",
        courseId: "course-id",
        options: validOptions,
      });

      expect(ownershipMock.resolveOwnerId).toHaveBeenCalledWith(userAuthUser, undefined);
      expect(scopeServiceMock.normalize).toHaveBeenCalledWith(expect.objectContaining({ courseId: "course-id" }), true);
      expect(scopeServiceMock.resolveOwned).toHaveBeenCalledWith(courseScope, userAuthUser.id);
      expect(questionRepositoryMock.create).toHaveBeenCalledWith({
        userId: userAuthUser.id,
        statement: "What is 2 + 2?",
        type: "MULTIPLE_CHOICE",
        explanation: "basic math",
        ...courseScope,
        options: [
          { text: "Option A", isCorrect: true, order: 0 },
          { text: "Option B", isCorrect: false, order: 1 },
          { text: "Option C", isCorrect: false, order: 2 },
        ],
      });
      expect(result.id).toBe(question.id);
      expect(result.options[0]).toHaveProperty("isCorrect");
      expect(result.createdAt).toBe(question.createdAt.toISOString());
    });

    it("should save empty explanation as null", async () => {
      questionRepositoryMock.create.mockResolvedValue(makeQuestion());

      await service.create(userAuthUser, {
        statement: "statement",
        type: "TRUE_FALSE",
        explanation: "   ",
        courseId: "course-id",
        options: [{ text: "Verdadeiro", isCorrect: true }, { text: "Falso", isCorrect: false }],
      });

      expect(questionRepositoryMock.create).toHaveBeenCalledWith(expect.objectContaining({ explanation: null, type: "TRUE_FALSE" }));
    });

    it("should allow ADMIN to create a question for another user", async () => {
      ownershipMock.resolveOwnerId.mockResolvedValue("other-user");
      questionRepositoryMock.create.mockResolvedValue(makeQuestion({ userId: "other-user" }));

      await service.create(adminAuthUser, { statement: "s", type: "MULTIPLE_CHOICE", userId: "other-user", courseId: "course-id", options: validOptions });

      expect(ownershipMock.resolveOwnerId).toHaveBeenCalledWith(adminAuthUser, "other-user");
      expect(scopeServiceMock.resolveOwned).toHaveBeenCalledWith(courseScope, "other-user");
      expect(questionRepositoryMock.create).toHaveBeenCalledWith(expect.objectContaining({ userId: "other-user" }));
    });

    it("should propagate ValidationError when no scope is informed", async () => {
      scopeServiceMock.normalize.mockImplementation(() => { throw new ValidationError("Informe um escopo: curso, módulo ou disciplina") });

      await expect(service.create(userAuthUser, { statement: "s", type: "MULTIPLE_CHOICE", options: validOptions })).rejects.toThrow(ValidationError);
      expect(questionRepositoryMock.create).not.toHaveBeenCalled();
    });

    it("should propagate ForbiddenError when scope belongs to another user", async () => {
      scopeServiceMock.resolveOwned.mockRejectedValue(new ForbiddenError());

      await expect(service.create(userAuthUser, { statement: "s", type: "MULTIPLE_CHOICE", courseId: "course-id", options: validOptions })).rejects.toThrow(ForbiddenError);
      expect(questionRepositoryMock.create).not.toHaveBeenCalled();
    });

    it("should throw ValidationError when there are less than 2 options", async () => {
      const promise = service.create(userAuthUser, { statement: "s", type: "MULTIPLE_CHOICE", courseId: "course-id", options: [{ text: "A", isCorrect: true }] });

      await expect(promise).rejects.toThrow("Informe pelo menos 2 alternativas");
      expect(questionRepositoryMock.create).not.toHaveBeenCalled();
    });

    it("should throw ValidationError when TRUE_FALSE question does not have exactly 2 options", async () => {
      const promise = service.create(userAuthUser, { statement: "s", type: "TRUE_FALSE", courseId: "course-id", options: validOptions });

      await expect(promise).rejects.toThrow("Questões de verdadeiro ou falso devem ter exatamente 2 alternativas");
    });

    it("should throw ValidationError when there are more than 6 options", async () => {
      const options = Array.from({ length: 7 }, (_, index) => ({ text: `option ${index}`, isCorrect: index === 0 }));

      await expect(service.create(userAuthUser, { statement: "s", type: "MULTIPLE_CHOICE", courseId: "course-id", options })).rejects.toThrow("Informe no máximo 6 alternativas");
    });

    it("should accept exactly 6 options", async () => {
      const options = Array.from({ length: 6 }, (_, index) => ({ text: `option ${index}`, isCorrect: index === 0 }));
      questionRepositoryMock.create.mockResolvedValue(makeQuestion());

      await service.create(userAuthUser, { statement: "s", type: "MULTIPLE_CHOICE", courseId: "course-id", options });

      expect(questionRepositoryMock.create).toHaveBeenCalledTimes(1);
    });

    it("should throw ValidationError when no option is correct", async () => {
      const options = [{ text: "A", isCorrect: false }, { text: "B", isCorrect: false }];

      await expect(service.create(userAuthUser, { statement: "s", type: "MULTIPLE_CHOICE", courseId: "course-id", options })).rejects.toThrow("Marque exatamente uma alternativa correta");
    });

    it("should throw ValidationError when more than one option is correct", async () => {
      const options = [{ text: "A", isCorrect: true }, { text: "B", isCorrect: true }];

      await expect(service.create(userAuthUser, { statement: "s", type: "MULTIPLE_CHOICE", courseId: "course-id", options })).rejects.toThrow("Marque exatamente uma alternativa correta");
    });

    it("should throw ValidationError when options are repeated (case and spaces insensitive)", async () => {
      const options = [{ text: "Answer", isCorrect: true }, { text: "  answer ", isCorrect: false }];

      await expect(service.create(userAuthUser, { statement: "s", type: "MULTIPLE_CHOICE", courseId: "course-id", options })).rejects.toThrow("As alternativas não podem se repetir");
    });

    it("should propagate repository error", async () => {
      questionRepositoryMock.create.mockRejectedValue(new Error("db error"));

      await expect(service.create(userAuthUser, { statement: "s", type: "MULTIPLE_CHOICE", courseId: "course-id", options: validOptions })).rejects.toThrow("db error");
    });
  });

  describe("findById", () => {
    it("should return the question with answers", async () => {
      const question = makeQuestion({ userId: userAuthUser.id });
      questionRepositoryMock.findById.mockResolvedValue(question);

      const result = await service.findById(userAuthUser, question.id);

      expect(ownershipMock.validateOwnership).toHaveBeenCalledWith(userAuthUser, userAuthUser.id);
      expect(result?.explanation).toBe(question.explanation);
      expect(result?.options.map(option => option.isCorrect)).toEqual([true, false]);
    });

    it("should return null when question does not exist", async () => {
      questionRepositoryMock.findById.mockResolvedValue(null);

      const result = await service.findById(userAuthUser, "missing");

      expect(result).toBeNull();
      expect(ownershipMock.validateOwnership).not.toHaveBeenCalled();
    });

    it("should propagate ForbiddenError when user does not own the question", async () => {
      questionRepositoryMock.findById.mockResolvedValue(makeQuestion({ userId: "other-user" }));
      ownershipMock.validateOwnership.mockImplementationOnce(() => { throw new ForbiddenError() });

      await expect(service.findById(userAuthUser, "question-id")).rejects.toThrow(ForbiddenError);
    });
  });

  describe("findAllByUserId", () => {
    it("should validate ownership and return mapped questions", async () => {
      const questions = [makeQuestion({ userId: userAuthUser.id }), makeQuestion({ userId: userAuthUser.id })];
      questionRepositoryMock.findAllByUserId.mockResolvedValue(questions);

      const filter = { courseId: "course-id", search: "math" };
      const result = await service.findAllByUserId(userAuthUser, userAuthUser.id, filter);

      expect(ownershipMock.validateOwnership).toHaveBeenCalledWith(userAuthUser, userAuthUser.id);
      expect(questionRepositoryMock.findAllByUserId).toHaveBeenCalledWith(userAuthUser.id, filter);
      expect(result.map(item => item.id)).toEqual(questions.map(item => item.id));
    });

    it("should not query the repository when ownership fails", async () => {
      ownershipMock.validateOwnership.mockImplementationOnce(() => { throw new ForbiddenError() });

      await expect(service.findAllByUserId(userAuthUser, "other-user", {})).rejects.toThrow(ForbiddenError);
      expect(questionRepositoryMock.findAllByUserId).not.toHaveBeenCalled();
    });
  });

  describe("update", () => {
    it("should update statement, explanation and options", async () => {
      const question = makeQuestion({ userId: userAuthUser.id, type: "MULTIPLE_CHOICE" });
      questionRepositoryMock.findById.mockResolvedValue(question);
      questionRepositoryMock.update.mockResolvedValue(question);

      await service.update(userAuthUser, question.id, {
        statement: "  new statement ",
        explanation: "",
        options: [{ text: "X", isCorrect: false }, { text: "Y", isCorrect: true }],
      });

      expect(ownershipMock.validateOwnership).toHaveBeenCalledWith(userAuthUser, userAuthUser.id);
      expect(questionRepositoryMock.update).toHaveBeenCalledWith(question.id, {
        statement: "new statement",
        explanation: null,
        options: [
          { text: "X", isCorrect: false, order: 0 },
          { text: "Y", isCorrect: true, order: 1 },
        ],
      });
    });

    it("should replace the options inside a transaction", async () => {
      const question = makeQuestion({ userId: userAuthUser.id });
      questionRepositoryMock.findById.mockResolvedValue(question);
      questionRepositoryMock.update.mockResolvedValue(question);

      await service.update(userAuthUser, question.id, { options: validOptions });

      expect(transactionMock.execute).toHaveBeenCalledTimes(1);
      expect(questionRepositoryMock.update).toHaveBeenCalledTimes(1);
    });

    it("should propagate errors thrown inside the transaction", async () => {
      const question = makeQuestion({ userId: userAuthUser.id });
      questionRepositoryMock.findById.mockResolvedValue(question);
      questionRepositoryMock.update.mockRejectedValueOnce(new Error("db error"));

      await expect(service.update(userAuthUser, question.id, { options: validOptions })).rejects.toThrow("db error");
    });

    it("should only send informed fields", async () => {
      const question = makeQuestion({ userId: userAuthUser.id });
      questionRepositoryMock.findById.mockResolvedValue(question);
      questionRepositoryMock.update.mockResolvedValue(question);

      await service.update(userAuthUser, question.id, { statement: "only statement" });

      expect(questionRepositoryMock.update).toHaveBeenCalledWith(question.id, { statement: "only statement" });
    });

    it("should validate options using the stored question type", async () => {
      const question = makeQuestion({ userId: userAuthUser.id, type: "TRUE_FALSE" });
      questionRepositoryMock.findById.mockResolvedValue(question);

      await expect(service.update(userAuthUser, question.id, { options: validOptions })).rejects.toThrow(ValidationError);
      expect(questionRepositoryMock.update).not.toHaveBeenCalled();
    });

    it("should throw NotFoundError when question does not exist", async () => {
      questionRepositoryMock.findById.mockResolvedValue(null);

      await expect(service.update(userAuthUser, "missing", { statement: "s" })).rejects.toThrow(NotFoundError);
      expect(questionRepositoryMock.update).not.toHaveBeenCalled();
    });

    it("should propagate ForbiddenError when user does not own the question", async () => {
      questionRepositoryMock.findById.mockResolvedValue(makeQuestion({ userId: "other-user" }));
      ownershipMock.validateOwnership.mockImplementationOnce(() => { throw new ForbiddenError() });

      await expect(service.update(userAuthUser, "question-id", { statement: "s" })).rejects.toThrow(ForbiddenError);
      expect(questionRepositoryMock.update).not.toHaveBeenCalled();
    });
  });

  describe("softDelete", () => {
    it("should soft delete an owned question", async () => {
      const question = makeQuestion({ userId: userAuthUser.id });
      questionRepositoryMock.findById.mockResolvedValue(question);

      await service.softDelete(userAuthUser, question.id);

      expect(ownershipMock.validateOwnership).toHaveBeenCalledWith(userAuthUser, userAuthUser.id);
      expect(questionRepositoryMock.softDelete).toHaveBeenCalledWith(question.id);
    });

    it("should be idempotent when question does not exist", async () => {
      questionRepositoryMock.findById.mockResolvedValue(null);

      await expect(service.softDelete(userAuthUser, "missing")).resolves.toBeUndefined();
      expect(questionRepositoryMock.softDelete).not.toHaveBeenCalled();
    });

    it("should not delete when ownership fails", async () => {
      questionRepositoryMock.findById.mockResolvedValue(makeQuestion({ userId: "other-user" }));
      ownershipMock.validateOwnership.mockImplementationOnce(() => { throw new ForbiddenError() });

      await expect(service.softDelete(userAuthUser, "question-id")).rejects.toThrow(ForbiddenError);
      expect(questionRepositoryMock.softDelete).not.toHaveBeenCalled();
    });
  });

  describe("mapResponse", () => {
    it("should hide correct answers and explanation when hideAnswers is true", () => {
      const question = makeQuestion({
        explanation: "secret",
        options: [makeQuestionOption({ isCorrect: true }), makeQuestionOption({ isCorrect: false })],
      });

      const result = QuestionService.mapResponse(question, true);

      expect(result.explanation).toBeNull();
      result.options.forEach(option => expect(option).not.toHaveProperty("isCorrect"));
    });
  });
});
