import { makePayload } from "../../../../tests/factories/make-payload";
import { AccessTokenService } from "./access-token.service";

describe("AccessTokenService", () => {
  const service = new AccessTokenService("test-secret");


  describe("generateAccessToken", () => {
    it("should generate a token string", () => {
      const token = service.generateAccessToken(makePayload());

      expect(typeof token).toBe("string");
    });

    it("should generate different tokens for different calls", () => {
      jest.useFakeTimers();
      jest.setSystemTime(new Date("2026-01-01T00:00:00Z"));

      const token1 = service.generateAccessToken(makePayload());

      jest.advanceTimersByTime(1000);

      const token2 = service.generateAccessToken(makePayload());

      expect(token1).not.toBe(token2);

      jest.useRealTimers()
    });
  });

  describe("extractPayload", () => {
    it("should extract payload correctly", () => {
      const token = service.generateAccessToken(makePayload());

      const payload = service.extractPayload(token);

      expect(payload.sub).toBe("user-1");
      expect(payload.sessionId).toBe("session-1");

      expect(payload.iat).toBeDefined();
      expect(payload.exp).toBeDefined();

      expect(payload.exp).toBeGreaterThan(payload.iat);
    });

    it("should fail with different secret", () => {
      const service1 = new AccessTokenService("secret-1");

      const token = service.generateAccessToken(makePayload());

      expect(() => {
        service1.extractPayload(token);
      }).toThrow();
    });

    it("should throw error for invalid token", () => {
      expect(() => {
        service.extractPayload("invalid-token");
      }).toThrow();
    });
  });
});
