import type { IUserRepository } from "../../modules/users/interfaces/user-repository.interface";
import { OwnershipService } from "./ownership.service";
import { AuthorizationError } from "../errors/authorization.error";
import { NotFoundError } from "../errors/not-found-error";
import { makeUser } from "../../tests/factories/make-user";
import type { AuthUserDTO } from "../../shared/DTOs/auth-user.DTO"

describe("OwnershipService", () => {

  const userRepositoryMock: jest.Mocked<IUserRepository> = {
    create: jest.fn(),
    findById: jest.fn(),
    findByUsername: jest.fn(),
    update: jest.fn(),
    updatePassword: jest.fn(),
    softDelete: jest.fn(),
  };

  const service = new OwnershipService(userRepositoryMock);

  beforeEach(() => {
    jest.clearAllMocks();
  });


  describe("resolveOwnerId", () => {

    describe("when authUser is ADMIN", () => {

      it("should return authUser.id when no userId is provided", async () => {
        const admin: AuthUserDTO = { id: "admin-id", role: "ADMIN", sessionId: "default"  };

        const result = await service.resolveOwnerId(admin);

        expect(result).toBe("admin-id");
        expect(userRepositoryMock.findById).not.toHaveBeenCalled();
      });

      it("should return authUser.id when userId equals authUser.id", async () => {
        const admin: AuthUserDTO = { id: "admin-id", role: "ADMIN", sessionId: "default"  };

        const result = await service.resolveOwnerId(admin, "admin-id");

        expect(result).toBe("admin-id");
        expect(userRepositoryMock.findById).not.toHaveBeenCalled();
      });

      it("should return the provided userId when it differs from authUser.id and the user exists", async () => {
        const admin: AuthUserDTO = { id: "admin-id", role: "ADMIN", sessionId: "default"  };
        const targetUser = makeUser({ id: "target-user-id" });

        userRepositoryMock.findById.mockResolvedValue(targetUser);

        const result = await service.resolveOwnerId(admin, "target-user-id");

        expect(result).toBe("target-user-id");
        expect(userRepositoryMock.findById).toHaveBeenCalledTimes(1);
        expect(userRepositoryMock.findById).toHaveBeenCalledWith("target-user-id");
      });

      it("should throw NotFoundError when userId differs from authUser.id and the user does not exist", async () => {
        const admin: AuthUserDTO = { id: "admin-id", role: "ADMIN", sessionId: "default"  };

        userRepositoryMock.findById.mockResolvedValue(null);

        const promise = service.resolveOwnerId(admin, "nonexistent-id");

        await expect(promise).rejects.toBeInstanceOf(NotFoundError);
        await expect(promise).rejects.toThrow("Usuário não encontrado");
        expect(userRepositoryMock.findById).toHaveBeenCalledWith("nonexistent-id");
      });

    });

    describe("when authUser is not ADMIN", () => {

      it("should return authUser.id when no userId is provided", async () => {
        const user: AuthUserDTO = { id: "user-id", role: "USER", sessionId: "default"  };

        const result = await service.resolveOwnerId(user);

        expect(result).toBe("user-id");
        expect(userRepositoryMock.findById).not.toHaveBeenCalled();
      });

      it("should return authUser.id when userId equals authUser.id", async () => {
        const user: AuthUserDTO = { id: "user-id", role: "USER", sessionId: "default"  };

        const result = await service.resolveOwnerId(user, "user-id");

        expect(result).toBe("user-id");
        expect(userRepositoryMock.findById).not.toHaveBeenCalled();
      });

      it("should throw AuthorizationError when userId differs from authUser.id", async () => {
        const user: AuthUserDTO = { id: "user-id", role: "USER", sessionId: "default"  };

        const promise = service.resolveOwnerId(user, "other-user-id");

        await expect(promise).rejects.toBeInstanceOf(AuthorizationError);
        await expect(promise).rejects.toThrow("Ação não autorizada");
        expect(userRepositoryMock.findById).not.toHaveBeenCalled();
      });

    });

  });


  describe("validateOwnership", () => {

    it("should not throw when the user is the owner", () => {
      const user = makeUser();

      expect(() => service.validateOwnership(user, user.id)).not.toThrow();
    });

    it("should not throw when the user is ADMIN and not the owner", () => {
      const admin = makeUser({ id: "admin-id", role: "ADMIN" });

      expect(() => service.validateOwnership(admin, "other-user-id")).not.toThrow();
    });

    it("should not throw when the user is ADMIN and also the owner", () => {
      const admin = makeUser({ id: "admin-id", role: "ADMIN" });

      expect(() => service.validateOwnership(admin, "admin-id")).not.toThrow();
    });

    it("should throw AuthorizationError when user is not the owner and not ADMIN", () => {
      const user = makeUser({ id: "user-id", role: "USER" });

      expect(() => service.validateOwnership(user, "other-user-id"))
        .toThrow(AuthorizationError);
    });

    it("should throw AuthorizationError with the correct message", () => {
      const user = makeUser({ id: "user-id", role: "USER" });

      expect(() => service.validateOwnership(user, "other-user-id"))
        .toThrow("Ação não autorizada");
    });

  });


  describe("validateStrictOwnership", () => {

    it("should not throw when the user is the owner", () => {
      const user = makeUser();

      expect(() => service.validateStrictOwnership(user, user.id)).not.toThrow();
    });

    it("should throw AuthorizationError when the user is not the owner, even if ADMIN", () => {
      const admin = makeUser({ id: "admin-id", role: "ADMIN" });

      expect(() => service.validateStrictOwnership(admin, "other-user-id"))
        .toThrow(AuthorizationError);
    });

    it("should throw AuthorizationError when a regular user tries to access another user's resource", () => {
      const user = makeUser({ id: "user-id", role: "USER" });

      expect(() => service.validateStrictOwnership(user, "other-user-id"))
        .toThrow(AuthorizationError);
    });

    it("should throw AuthorizationError with the correct message", () => {
      const user = makeUser({ id: "user-id", role: "USER" });

      expect(() => service.validateStrictOwnership(user, "other-user-id"))
        .toThrow("Ação não autorizada");
    });

  });

});