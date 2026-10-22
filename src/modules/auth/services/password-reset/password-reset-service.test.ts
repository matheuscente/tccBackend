import { ValidationError } from "../../../../shared/errors/validation-error";
import type { IHashProvider } from "../../../../shared/hash/interfaces/hash-provider.interface";
import type { IMailProvider } from "../../../../shared/mail/interfaces/mail-provider.interface";
import type { IUserRepository } from "../../../users/interfaces/user-repository.interface";
import type { ISessionService } from "../../../sessions/interfaces/services/session-service.interface";
import type { IPasswordResetRepository } from "../../interfaces/password-reset/password-reset-repository.interface";
import type { PasswordResetToken } from "@prisma/client";
import { makeUser } from "../../../../tests/factories/make-user";
import { PasswordResetService } from "./password-reset.service";

describe("PasswordResetService", () => {

  const userRepositoryMock: jest.Mocked<IUserRepository> = {
    create: jest.fn(),
    findById: jest.fn(),
    findByUsername: jest.fn(),
    findByEmail: jest.fn(),
    update: jest.fn(),
    updatePassword: jest.fn(),
    softDelete: jest.fn(),
    findMany: jest.fn(),
    updateRole: jest.fn(),
  };

  const passwordResetRepositoryMock: jest.Mocked<IPasswordResetRepository> = {
    create: jest.fn(),
    findById: jest.fn(),
    markAsUsed: jest.fn(),
    invalidateAllByUserId: jest.fn(),
  };

  const sessionServiceMock: jest.Mocked<ISessionService> = {
    createSession: jest.fn(),
    refreshSession: jest.fn(),
    invalidateSession: jest.fn(),
    invalidateAllByUserId: jest.fn(),
    validateSession: jest.fn(),
  };

  const hashMock: jest.Mocked<IHashProvider> = {
    hash: jest.fn(),
    compare: jest.fn(),
  };

  const mailProviderMock: jest.Mocked<IMailProvider> = {
    send: jest.fn(),
  };

  const frontendUrl = "http://front.test";

  const service = new PasswordResetService(
    userRepositoryMock,
    passwordResetRepositoryMock,
    sessionServiceMock,
    hashMock,
    mailProviderMock,
    frontendUrl
  );

  const makeToken = (overrides?: Partial<PasswordResetToken>): PasswordResetToken => ({
    id: "token-id",
    userId: "user-id",
    tokenHash: "hashed-secret",
    expiresAt: new Date(Date.now() + 10 * 60 * 1000),
    usedAt: null,
    createdAt: new Date(),
    ...overrides,
  });

  beforeEach(() => {
    jest.clearAllMocks();
    hashMock.hash.mockImplementation(async (value) => `hashed-${value}`);
  });

  describe("requestReset", () => {
    it("should create a token and send the reset e-mail", async () => {
      const user = makeUser({ id: "user-id", email: "john@test.com", name: "John" });
      userRepositoryMock.findByEmail.mockResolvedValue(user);
      passwordResetRepositoryMock.create.mockResolvedValue(makeToken({ id: "record-id" }));

      const before = Date.now();
      await service.requestReset({ email: "  John@Test.com " });

      expect(userRepositoryMock.findByEmail).toHaveBeenCalledWith("john@test.com");
      expect(passwordResetRepositoryMock.invalidateAllByUserId).toHaveBeenCalledWith(user.id);
      expect(passwordResetRepositoryMock.invalidateAllByUserId.mock.invocationCallOrder[0])
        .toBeLessThan(passwordResetRepositoryMock.create.mock.invocationCallOrder[0]!);

      const secret = hashMock.hash.mock.calls[0]![0];
      expect(secret).toMatch(/^[0-9a-f-]{36}$/);
      const createData = passwordResetRepositoryMock.create.mock.calls[0]![0];
      expect(createData.userId).toBe(user.id);
      expect(createData.tokenHash).toBe(`hashed-${secret}`);
      expect(createData.expiresAt.getTime()).toBeGreaterThanOrEqual(before + 30 * 60 * 1000);
      expect(createData.expiresAt.getTime()).toBeLessThanOrEqual(Date.now() + 30 * 60 * 1000);

      expect(mailProviderMock.send).toHaveBeenCalledTimes(1);
      const mail = mailProviderMock.send.mock.calls[0]![0];
      const expectedLink = `${frontendUrl}/reset-password?token=${encodeURIComponent(`record-id.${secret}`)}`;
      expect(mail.to).toBe(user.email);
      expect(mail.subject).toBe("Redefinição de senha - Organizador de Estudos");
      expect(mail.text).toContain(expectedLink);
      expect(mail.html).toContain(`href="${expectedLink}"`);
      expect(mail.text).not.toContain(createData.tokenHash);
    });

    it("should return silently when the e-mail is unknown", async () => {
      userRepositoryMock.findByEmail.mockResolvedValue(null);

      await expect(service.requestReset({ email: "unknown@test.com" })).resolves.toBeUndefined();

      expect(passwordResetRepositoryMock.invalidateAllByUserId).not.toHaveBeenCalled();
      expect(passwordResetRepositoryMock.create).not.toHaveBeenCalled();
      expect(mailProviderMock.send).not.toHaveBeenCalled();
    });

    it("should not reveal the account when the mail provider fails", async () => {
      const consoleSpy = jest.spyOn(console, "error").mockImplementation(() => undefined);
      userRepositoryMock.findByEmail.mockResolvedValue(makeUser());
      passwordResetRepositoryMock.create.mockResolvedValue(makeToken());
      mailProviderMock.send.mockRejectedValueOnce(new Error("smtp error"));

      await expect(service.requestReset({ email: "a@test.com" })).resolves.toBeUndefined();
      expect(consoleSpy).toHaveBeenCalled();

      consoleSpy.mockRestore();
    });
  });

  describe("resetPassword", () => {
    it("should update the password, mark the token as used and invalidate sessions", async () => {
      const user = makeUser({ id: "user-id" });
      passwordResetRepositoryMock.findById.mockResolvedValue(makeToken());
      hashMock.compare.mockResolvedValue(true);
      userRepositoryMock.findById.mockResolvedValue(user);
      passwordResetRepositoryMock.markAsUsed.mockResolvedValue(true);

      await service.resetPassword({ token: "token-id.secret", newPassword: "NewPassword@123" });

      expect(passwordResetRepositoryMock.findById).toHaveBeenCalledWith("token-id");
      expect(hashMock.compare).toHaveBeenCalledWith("secret", "hashed-secret");
      expect(userRepositoryMock.findById).toHaveBeenCalledWith("user-id");
      expect(hashMock.hash).toHaveBeenCalledWith("NewPassword@123");
      expect(userRepositoryMock.updatePassword).toHaveBeenCalledWith(user.id, "hashed-NewPassword@123");
      expect(passwordResetRepositoryMock.markAsUsed).toHaveBeenCalledWith("token-id");
      expect(sessionServiceMock.invalidateAllByUserId).toHaveBeenCalledWith(user.id);
    });

    it("should reject the token when it was already claimed by a concurrent request", async () => {
      passwordResetRepositoryMock.findById.mockResolvedValue(makeToken());
      hashMock.compare.mockResolvedValue(true);
      userRepositoryMock.findById.mockResolvedValue(makeUser({ id: "user-id" }));
      passwordResetRepositoryMock.markAsUsed.mockResolvedValue(false);

      await expect(service.resetPassword({ token: "token-id.secret", newPassword: "NewPassword@123" })).rejects.toThrow(ValidationError);
      expect(userRepositoryMock.updatePassword).not.toHaveBeenCalled();
    });

    it.each(["", "no-dot", ".secret", "token-id."])("should throw ValidationError for malformed token '%s'", async (token) => {
      await expect(service.resetPassword({ token, newPassword: "x" })).rejects.toThrow("Link de redefinição inválido");
      expect(passwordResetRepositoryMock.findById).not.toHaveBeenCalled();
    });

    it("should throw ValidationError when token does not exist", async () => {
      passwordResetRepositoryMock.findById.mockResolvedValue(null);

      await expect(service.resetPassword({ token: "token-id.secret", newPassword: "x" })).rejects.toThrow("Link de redefinição inválido ou expirado");
      expect(userRepositoryMock.updatePassword).not.toHaveBeenCalled();
    });

    it("should throw ValidationError when token was already used", async () => {
      passwordResetRepositoryMock.findById.mockResolvedValue(makeToken({ usedAt: new Date() }));

      await expect(service.resetPassword({ token: "token-id.secret", newPassword: "x" })).rejects.toThrow(ValidationError);
      expect(hashMock.compare).not.toHaveBeenCalled();
      expect(userRepositoryMock.updatePassword).not.toHaveBeenCalled();
    });

    it("should throw ValidationError when token is expired", async () => {
      passwordResetRepositoryMock.findById.mockResolvedValue(makeToken({ expiresAt: new Date(Date.now() - 1000) }));

      await expect(service.resetPassword({ token: "token-id.secret", newPassword: "x" })).rejects.toThrow("Link de redefinição inválido ou expirado");
      expect(hashMock.compare).not.toHaveBeenCalled();
      expect(userRepositoryMock.updatePassword).not.toHaveBeenCalled();
    });

    it("should throw ValidationError when the secret does not match", async () => {
      passwordResetRepositoryMock.findById.mockResolvedValue(makeToken());
      hashMock.compare.mockResolvedValue(false);

      await expect(service.resetPassword({ token: "token-id.wrong", newPassword: "x" })).rejects.toThrow("Link de redefinição inválido ou expirado");
      expect(userRepositoryMock.updatePassword).not.toHaveBeenCalled();
      expect(passwordResetRepositoryMock.markAsUsed).not.toHaveBeenCalled();
      expect(sessionServiceMock.invalidateAllByUserId).not.toHaveBeenCalled();
    });

    it("should throw ValidationError when the user no longer exists", async () => {
      passwordResetRepositoryMock.findById.mockResolvedValue(makeToken());
      hashMock.compare.mockResolvedValue(true);
      userRepositoryMock.findById.mockResolvedValue(null);

      await expect(service.resetPassword({ token: "token-id.secret", newPassword: "x" })).rejects.toThrow(ValidationError);
      expect(userRepositoryMock.updatePassword).not.toHaveBeenCalled();
    });
  });
});
