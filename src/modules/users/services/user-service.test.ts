import type { IHashProvider } from "../../../shared/hash/interfaces/hash-provider.interface";
import type { IUserRepository } from "../interfaces/user-repository.interface";
import { UserService } from "./user.service";
import { ValidationError } from "../../../shared/errors/validation-error";
import { NotFoundError } from "../../../shared/errors/not-found-error";
import { AuthorizationError } from "../../../shared/errors/authorization.error";
import type { UpdateUserDTO } from "../DTOs/update-user.dto";
import type { Isanitize } from "../../../shared/sanitize/interfaces/sanitize.interface";
import { makeUser } from "../../../tests/factories/make-user";
import type { ISessionRepository } from "../../sessions/interfaces/repositories/session-repository.interface";
import type { ITransaction } from "../../transaction/interfaces/transaction.interface";
import type { IModuleRepository } from "../../modules/interfaces/repositories/module-repository.interface";
import type { ICourseRepository } from "../../courses/interfaces/repositories/course-repository.interface";
import type { AuthUserDTO } from "../../../shared/DTOs/auth-user.DTO";
import type { IOwnershipService } from "../../../shared/ownership/ownership-service.interface";
import type { IGoalRepository } from "../../goals/interfaces/repositories/goal-respository.interface";

describe("user service tests", () => {
  const sanitizeMock: jest.Mocked<Isanitize> = {
    sanitizeUsername: jest.fn(),
    sanitizeName: jest.fn(),
    removeAccents: jest.fn(),
  };

  sanitizeMock.sanitizeName.mockImplementation((value) =>
    value.toUpperCase().trim(),
  );
  sanitizeMock.sanitizeUsername.mockImplementation((value) =>
    value.toLowerCase().trim(),
  );

  const repositoryMock: jest.Mocked<IUserRepository> = {
    create: jest.fn(),
    findById: jest.fn(),
    findByUsername: jest.fn(),
    update: jest.fn(),
    updatePassword: jest.fn(),
    softDelete: jest.fn(),
  };

  const hashMock: jest.Mocked<IHashProvider> = {
    hash: jest.fn(),
    compare: jest.fn(),
  };

  const sessionRepositoryMock: jest.Mocked<ISessionRepository> = {
    create: jest.fn(),
    findByUserId: jest.fn(),
    findById: jest.fn(),
    findByIdWithUser: jest.fn(),
    invalidate: jest.fn(),
    update: jest.fn(),
    invalidateAllByUserId: jest.fn(),
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
    findByIdWithCourse: jest.fn(),
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

  const ownerMock: jest.Mocked<IOwnershipService> = {
    resolveOwnerId: jest.fn(),
    validateOwnership: jest.fn(),
    validateStrictOwnership: jest.fn(),
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

  const transactionMock: jest.Mocked<ITransaction> = {
    execute: jest.fn().mockImplementation(async (callback) => {
      return callback({
        moduleRepository: moduleRepositoryMock,
        courseRepository: courseRepositoryMock,
        userRepository: repositoryMock,
        sessionRepository: sessionRepositoryMock,
        goalRepository: goalRepositoryMock,
      });
    }),
  };

  const service = new UserService(
    repositoryMock,
    hashMock,
    sanitizeMock,
    transactionMock,
    ownerMock,
  );

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("findByUsername tests", () => {
    it("should find a user successfully when authUser is the owner", async () => {
      const user = makeUser();
      const authUser: AuthUserDTO = {
        id: user.id,
        role: user.role,
        sessionId: "default",
      };

      repositoryMock.findByUsername.mockResolvedValue(user);

      const result = await service.findByUsername(authUser, user.username);

      expect(repositoryMock.findByUsername).toHaveBeenCalledTimes(1);
      expect(repositoryMock.findByUsername).toHaveBeenCalledWith(user.username);
      expect(result).not.toBeNull();
      expect(result).not.toHaveProperty("password");
      expect(result).not.toHaveProperty("deletedAt");
      expect(result).toMatchObject({
        id: user.id,
        name: user.name,
        username: user.username,
        role: user.role,
        birthDate: user.birthDate,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      });
    });

    it("should find a user successfully when authUser is ADMIN", async () => {
      const user = makeUser();
      const adminUser: AuthUserDTO = {
        id: "other-id",
        role: "ADMIN",
        sessionId: "default",
      };

      repositoryMock.findByUsername.mockResolvedValue(user);

      const result = await service.findByUsername(adminUser, user.username);

      expect(repositoryMock.findByUsername).toHaveBeenCalledTimes(1);
      expect(result).not.toBeNull();
      expect(result?.id).toBe(user.id);
    });

    it("should return null when authUser is not the owner and not ADMIN", async () => {
      const user = makeUser();
      const otherUser: AuthUserDTO = {
        id: "other-id",
        role: "USER",
        sessionId: "default",
      };

      repositoryMock.findByUsername.mockResolvedValue(user);

      const result = await service.findByUsername(otherUser, user.username);

      expect(repositoryMock.findByUsername).toHaveBeenCalledTimes(1);
      expect(result).toBeNull();
    });

    it("should return null when the username does not exist", async () => {
      const authUser: AuthUserDTO = {
        id: "any-id",
        role: "USER",
        sessionId: "default",
      };

      repositoryMock.findByUsername.mockResolvedValue(null);

      const result = await service.findByUsername(authUser, "nonexistent");

      expect(repositoryMock.findByUsername).toHaveBeenCalledTimes(1);
      expect(repositoryMock.findByUsername).toHaveBeenCalledWith("nonexistent");
      expect(result).toBeNull();
    });
  });

  describe("updatePassword tests", () => {
    it("should update a password successfully as the owner", async () => {
      const user = makeUser({ password: "hashed-old-password" });
      const authUser: AuthUserDTO = {
        id: user.id,
        role: user.role,
        sessionId: "default",
      };

      repositoryMock.findById.mockResolvedValue(user);
      hashMock.compare.mockResolvedValue(true);
      hashMock.hash.mockResolvedValue("hashed-new-password");
      ownerMock.validateOwnership.mockReturnValue(undefined);

      await service.updatePassword(
        authUser,
        user.id,
        "old-password",
        "new-password",
      );

      expect(repositoryMock.findById).toHaveBeenCalledWith(user.id);
      expect(ownerMock.validateOwnership).toHaveBeenCalledWith(
        authUser,
        user.id,
      );
      expect(hashMock.compare).toHaveBeenCalledWith(
        "old-password",
        user.password,
      );
      expect(hashMock.hash).toHaveBeenCalledWith("new-password");
      expect(repositoryMock.updatePassword).toHaveBeenCalledWith(
        user.id,
        "hashed-new-password",
      );
    });

    it("should throw AuthorizationError when authUser is not the owner", async () => {
      const user = makeUser({ password: "hashed-old-password" });
      const otherUser: AuthUserDTO = {
        id: "other-id",
        role: "USER",
        sessionId: "default",
      };

      repositoryMock.findById.mockResolvedValue(user);
      ownerMock.validateOwnership.mockImplementation(() => {
        throw new AuthorizationError("Acesso negado");
      });

      const promise = service.updatePassword(
        otherUser,
        user.id,
        "old-password",
        "new-password",
      );

      await expect(promise).rejects.toBeInstanceOf(AuthorizationError);
      expect(ownerMock.validateOwnership).toHaveBeenCalledWith(
        otherUser,
        user.id,
      );
      expect(hashMock.compare).not.toHaveBeenCalled();
      expect(hashMock.hash).not.toHaveBeenCalled();
      expect(repositoryMock.updatePassword).not.toHaveBeenCalled();
    });

    it("should throw ValidationError when the old password is incorrect", async () => {
      const user = makeUser({ password: "hashed-old-password" });
      const authUser: AuthUserDTO = {
        id: user.id,
        role: user.role,
        sessionId: "default",
      };

      repositoryMock.findById.mockResolvedValue(user);
      hashMock.compare.mockResolvedValue(false);
      ownerMock.validateOwnership.mockReturnValue(undefined);

      const promise = service.updatePassword(
        authUser,
        user.id,
        "wrong-password",
        "new-password",
      );

      await expect(promise).rejects.toBeInstanceOf(ValidationError);
      await expect(promise).rejects.toThrow("senha inválida!");
      expect(hashMock.compare).toHaveBeenCalledWith(
        "wrong-password",
        user.password,
      );
      expect(hashMock.hash).not.toHaveBeenCalled();
      expect(repositoryMock.updatePassword).not.toHaveBeenCalled();
    });

    it("should throw NotFoundError when user does not exist", async () => {
      const authUser: AuthUserDTO = {
        id: "nonexistent-id",
        role: "USER",
        sessionId: "default",
      };

      repositoryMock.findById.mockResolvedValue(null);

      const promise = service.updatePassword(
        authUser,
        "nonexistent-id",
        "old-password",
        "new-password",
      );

      await expect(promise).rejects.toBeInstanceOf(NotFoundError);
      await expect(promise).rejects.toThrow("usuário não encontrado");
      expect(ownerMock.validateOwnership).not.toHaveBeenCalled();
      expect(hashMock.compare).not.toHaveBeenCalled();
      expect(hashMock.hash).not.toHaveBeenCalled();
      expect(repositoryMock.updatePassword).not.toHaveBeenCalled();
    });
  });

  describe("update tests", () => {
    it("should update a user successfully as the owner", async () => {
      const user = makeUser();
      const authUser: AuthUserDTO = {
        id: user.id,
        role: user.role,
        sessionId: "default",
      };

      repositoryMock.findById.mockResolvedValue(user);
      repositoryMock.update.mockResolvedValue(user);
      repositoryMock.findByUsername.mockResolvedValue(null);
      ownerMock.validateOwnership.mockReturnValue(undefined);

      const result = await service.update(authUser, user.id, {
        name: "new name",
      });

      const expectedData: UpdateUserDTO = {
        name: "NEW NAME",
        username: user.username,
        birthDate: user.birthDate,
      };

      expect(repositoryMock.findById).toHaveBeenCalledWith(user.id);
      expect(ownerMock.validateOwnership).toHaveBeenCalledWith(
        authUser,
        user.id,
      );
      expect(repositoryMock.findByUsername).not.toHaveBeenCalled();
      expect(repositoryMock.update).toHaveBeenCalledWith(user.id, expectedData);
      expect(result).not.toHaveProperty("password");
      expect(result).not.toHaveProperty("deletedAt");
      expect(result).toHaveProperty("role");
    });

    it("should throw AuthorizationError when authUser is not the owner", async () => {
      const user = makeUser();
      const otherUser: AuthUserDTO = {
        id: "other-id",
        role: "USER",
        sessionId: "default",
      };

      repositoryMock.findById.mockResolvedValue(user);
      ownerMock.validateOwnership.mockImplementation(() => {
        throw new AuthorizationError("Acesso negado");
      });

      const promise = service.update(otherUser, user.id, { name: "hacker" });

      await expect(promise).rejects.toBeInstanceOf(AuthorizationError);
      expect(ownerMock.validateOwnership).toHaveBeenCalledWith(
        otherUser,
        user.id,
      );
      expect(repositoryMock.update).not.toHaveBeenCalled();
    });

    it("should throw NotFoundError when user does not exist", async () => {
      const authUser: AuthUserDTO = {
        id: "nonexistent-id",
        role: "USER",
        sessionId: "default",
      };

      repositoryMock.findById.mockResolvedValue(null);
      ownerMock.validateOwnership.mockReturnValue(undefined);

      const promise = service.update(authUser, "nonexistent-id", {
        name: "test",
      });

      await expect(promise).rejects.toBeInstanceOf(NotFoundError);
      await expect(promise).rejects.toThrow("Usuário não encontrado");
      expect(repositoryMock.update).not.toHaveBeenCalled();
    });

    it("should throw ValidationError when the new username is already taken", async () => {
      const user = makeUser();
      const authUser: AuthUserDTO = {
        id: user.id,
        role: user.role,
        sessionId: "default",
      };
      const existingUser = makeUser({ username: "taken" });

      repositoryMock.findById.mockResolvedValue(user);
      repositoryMock.findByUsername.mockResolvedValue(existingUser);
      ownerMock.validateOwnership.mockReturnValue(undefined);

      const promise = service.update(authUser, user.id, { username: "taken" });

      await expect(promise).rejects.toBeInstanceOf(ValidationError);
      await expect(promise).rejects.toThrow("Insira outro nome de usuário");
      expect(repositoryMock.findByUsername).toHaveBeenCalledWith("taken");
      expect(repositoryMock.update).not.toHaveBeenCalled();
    });

    it("should throw ValidationError for invalid birthDate", async () => {
      const user = makeUser();
      const authUser: AuthUserDTO = {
        id: user.id,
        role: user.role,
        sessionId: "default",
      };

      repositoryMock.findById.mockResolvedValue(user);
      ownerMock.validateOwnership.mockReturnValue(undefined);

      const promise = service.update(authUser, user.id, {
        birthDate: "31/02/2000",
      });

      await expect(promise).rejects.toBeInstanceOf(ValidationError);
      await expect(promise).rejects.toThrow("Data inválida!");
      expect(repositoryMock.update).not.toHaveBeenCalled();
    });

    it("should throw ValidationError when birthDate is in the future", async () => {
      const user = makeUser();
      const authUser: AuthUserDTO = {
        id: user.id,
        role: user.role,
        sessionId: "default",
      };
      const futureYear = new Date().getFullYear() + 1;

      repositoryMock.findById.mockResolvedValue(user);
      ownerMock.validateOwnership.mockReturnValue(undefined);

      const promise = service.update(authUser, user.id, {
        birthDate: `01/01/${futureYear}`,
      });

      await expect(promise).rejects.toBeInstanceOf(ValidationError);
      await expect(promise).rejects.toThrow(
        "Data de nascimento maior que a data atual",
      );
      expect(repositoryMock.update).not.toHaveBeenCalled();
    });

    it("should update birthDate successfully", async () => {
      const user = makeUser();
      const authUser: AuthUserDTO = {
        id: user.id,
        role: user.role,
        sessionId: "default",
      };

      repositoryMock.findById.mockResolvedValue(user);
      repositoryMock.update.mockResolvedValue(user);
      ownerMock.validateOwnership.mockReturnValue(undefined);

      await service.update(authUser, user.id, { birthDate: "31/10/2001" });

      const expectedBirthDate = new Date(Date.UTC(2001, 9, 31, 0, 0, 0));

      expect(repositoryMock.update).toHaveBeenCalledWith(
        user.id,
        expect.objectContaining({ birthDate: expectedBirthDate }),
      );
    });

    it("should allow ADMIN to update any user", async () => {
      const user = makeUser();
      const adminUser: AuthUserDTO = {
        id: "admin-id",
        role: "ADMIN",
        sessionId: "default",
      };

      repositoryMock.findById.mockResolvedValue(user);
      repositoryMock.update.mockResolvedValue(user);
      repositoryMock.findByUsername.mockResolvedValue(null);
      ownerMock.validateOwnership.mockReturnValue(undefined);

      const result = await service.update(adminUser, user.id, {
        name: "updated by admin",
      });

      expect(ownerMock.validateOwnership).toHaveBeenCalledWith(
        adminUser,
        user.id,
      );
      expect(repositoryMock.update).toHaveBeenCalledTimes(1);
      expect(result).not.toHaveProperty("password");
    });
  });

  describe("softDelete tests", () => {
    it("should delete a user successfully as the owner", async () => {
      const user = makeUser();
      const authUser: AuthUserDTO = {
        id: user.id,
        role: user.role,
        sessionId: "default",
      };

      repositoryMock.findById.mockResolvedValue(user);
      sessionRepositoryMock.invalidateAllByUserId.mockResolvedValue(undefined);
      ownerMock.validateOwnership.mockReturnValue(undefined);

      await service.softDelete(authUser, user.id);

      expect(transactionMock.execute).toHaveBeenCalledTimes(1);
      expect(repositoryMock.findById).toHaveBeenCalledWith(user.id);
      expect(ownerMock.validateOwnership).toHaveBeenCalledWith(
        authUser,
        user.id,
      );
      expect(courseRepositoryMock.softDeleteAllByUserId).toHaveBeenCalledWith(
        user.id,
      );
      expect(repositoryMock.softDelete).toHaveBeenCalledWith(user.id);
      expect(sessionRepositoryMock.invalidateAllByUserId).toHaveBeenCalledWith(
        user.id,
      );
      expect(goalRepositoryMock.deleteAllByUserId).toHaveBeenCalledTimes(1);
      expect(goalRepositoryMock.deleteAllByUserId).toHaveBeenCalledWith(
        user.id,
      );
    });

    it("should throw AuthorizationError when authUser is not the owner", async () => {
      const user = makeUser();
      const otherUser: AuthUserDTO = {
        id: "other-id",
        role: "USER",
        sessionId: "default",
      };

      repositoryMock.findById.mockResolvedValue(user);
      ownerMock.validateOwnership.mockImplementation(() => {
        throw new AuthorizationError("Acesso negado");
      });

      const promise = service.softDelete(otherUser, user.id);

      await expect(promise).rejects.toBeInstanceOf(AuthorizationError);
      expect(ownerMock.validateOwnership).toHaveBeenCalledWith(
        otherUser,
        user.id,
      );
      expect(repositoryMock.softDelete).not.toHaveBeenCalled();
      expect(courseRepositoryMock.softDeleteAllByUserId).not.toHaveBeenCalled();
      expect(
        sessionRepositoryMock.invalidateAllByUserId,
      ).not.toHaveBeenCalled();
      expect(goalRepositoryMock.deleteAllByUserId).not.toHaveBeenCalled();
    });

    it("should throw NotFoundError when user does not exist", async () => {
      const authUser: AuthUserDTO = {
        id: "nonexistent-id",
        role: "USER",
        sessionId: "default",
      };

      repositoryMock.findById.mockResolvedValue(null);

      const promise = service.softDelete(authUser, "nonexistent-id");

      await expect(promise).rejects.toBeInstanceOf(NotFoundError);
      await expect(promise).rejects.toThrow("usuario não encontrado");
      expect(transactionMock.execute).toHaveBeenCalledTimes(1);
      expect(ownerMock.validateOwnership).not.toHaveBeenCalled();
      expect(courseRepositoryMock.softDeleteAllByUserId).not.toHaveBeenCalled();
      expect(repositoryMock.softDelete).not.toHaveBeenCalled();
      expect(
        sessionRepositoryMock.invalidateAllByUserId,
      ).not.toHaveBeenCalled();
      expect(goalRepositoryMock.deleteAllByUserId).not.toHaveBeenCalled();
    });

    it("should allow ADMIN to delete any user", async () => {
      const user = makeUser();
      const adminUser: AuthUserDTO = {
        id: "admin-id",
        role: "ADMIN",
        sessionId: "default",
      };

      repositoryMock.findById.mockResolvedValue(user);
      sessionRepositoryMock.invalidateAllByUserId.mockResolvedValue(undefined);
      ownerMock.validateOwnership.mockReturnValue(undefined);

      await service.softDelete(adminUser, user.id);

      expect(ownerMock.validateOwnership).toHaveBeenCalledWith(
        adminUser,
        user.id,
      );
      expect(repositoryMock.softDelete).toHaveBeenCalledWith(user.id);
      expect(goalRepositoryMock.deleteAllByUserId).toHaveBeenCalledTimes(1);
      expect(goalRepositoryMock.deleteAllByUserId).toHaveBeenCalledWith(
        user.id,
      );
    });
  });
});
