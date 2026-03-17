import type { PrismaClient } from "@prisma/client";
import { Trasanction } from "./services/transaction.service";
import { ModuleRepository } from "../modules/repositories/module.repository"
import { CourseRepository } from "../courses/repositories/course.repository";
import { UserRepository } from "../users/repositories/user.repository";
import { SessionRepository } from "../sessions/repositories/session.repository";
import type { IRepositories } from "./interfaces/repositories.interface";
import { DisciplineRepository } from "../disciplines/repositories/discipline.repository";
import { GoalRepository } from "../goals/repositories/goal.repository";


// mock de todos os repositórios para isolar a Transaction
jest.mock("../modules/repositories/module.repository");
jest.mock("../courses/repositories/course.repository");
jest.mock("../users/repositories/user.repository");
jest.mock("../sessions/repositories/session.repository");
jest.mock("../disciplines/repositories/discipline.repository")
jest.mock("../goals/repositories/goal.repository");

describe("Transaction", () => {

  // tx é o cliente Prisma simulado dentro da transação
  const txMock = {} as PrismaClient;

  const prismaMock = {
    $transaction: jest.fn(),
  } as unknown as jest.Mocked<PrismaClient>;

  const transaction = new Trasanction(prismaMock);

  beforeEach(() => {
    jest.clearAllMocks();

    // simula o comportamento real do $transaction:
    // extrai o callback e o executa passando o txMock
    (prismaMock.$transaction as jest.Mock).mockImplementation(
      async (callback) => callback(txMock)
    );
  });

  describe("execute", () => {

    it("should call prisma.$transaction once", async () => {
      await transaction.execute(async () => {});

      expect(prismaMock.$transaction).toHaveBeenCalledTimes(1);
    });

    it("should instantiate all repositories with the transaction client (tx)", async () => {
      await transaction.execute(async () => {});

      expect(ModuleRepository).toHaveBeenCalledTimes(1);
      expect(ModuleRepository).toHaveBeenCalledWith(txMock);

      expect(CourseRepository).toHaveBeenCalledTimes(1);
      expect(CourseRepository).toHaveBeenCalledWith(
        txMock,
        expect.any(ModuleRepository)
      );

      expect(UserRepository).toHaveBeenCalledTimes(1);
      expect(UserRepository).toHaveBeenCalledWith(txMock);

      expect(SessionRepository).toHaveBeenCalledTimes(1);
      expect(SessionRepository).toHaveBeenCalledWith(txMock);

      expect(DisciplineRepository).toHaveBeenCalledTimes(1);
      expect(DisciplineRepository).toHaveBeenCalledWith(txMock);

      expect(GoalRepository).toHaveBeenCalledTimes(1);
      expect(GoalRepository).toHaveBeenCalledWith(txMock);
    });

    it("should call the work callback with the correct repository shape", async () => {
      const workMock = jest.fn().mockResolvedValue(undefined);

      await transaction.execute(workMock);

      expect(workMock).toHaveBeenCalledTimes(1);
      expect(workMock).toHaveBeenCalledWith(
        expect.objectContaining({
          moduleRepository: expect.any(ModuleRepository),
          courseRepository: expect.any(CourseRepository),
          userRepository: expect.any(UserRepository),
          sessionRepository: expect.any(SessionRepository),
          disciplineRepository: expect.any(DisciplineRepository),
          goalRepository: expect.any(GoalRepository)
        } satisfies Record<keyof IRepositories, unknown>)
      );
    });

    it("should return the value resolved by the work callback", async () => {
      const expected = { data: "resultado" };

      const result = await transaction.execute(async () => expected);

      expect(result).toEqual(expected);
    });

    it("should propagate errors thrown inside the work callback", async () => {
      const error = new Error("erro dentro da transação");

      const promise = transaction.execute(async () => {
        throw error;
      });

      await expect(promise).rejects.toThrow("erro dentro da transação");
      await expect(promise).rejects.toBe(error);
    });

    it("should propagate errors thrown by prisma.$transaction itself", async () => {
      const dbError = new Error("falha no banco de dados");

      (prismaMock.$transaction as jest.Mock).mockRejectedValue(dbError);

      const promise = transaction.execute(async () => {});

      await expect(promise).rejects.toThrow("falha no banco de dados");
      await expect(promise).rejects.toBe(dbError);
    });

    it("should work correctly with different return types", async () => {
      const numberResult = await transaction.execute(async () => 42);
      expect(numberResult).toBe(42);

      const arrayResult = await transaction.execute(async () => [1, 2, 3]);
      expect(arrayResult).toEqual([1, 2, 3]);

      const nullResult = await transaction.execute(async () => null);
      expect(nullResult).toBeNull();
    });

  });

});