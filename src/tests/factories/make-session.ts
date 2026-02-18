import type { Session } from "@prisma/client";

      export const makeSession = (overrrides?: Partial<Session>): Session => ({
        id: "session-id",
        userId: "user-id",
        refreshToken: "hashed-secret",
        expiresAt: new Date(Date.now() + 100000),
        isValid: true,
        createdAt: new Date(Date.now()),
        updatedAt: new Date(Date.now()),
        ...overrrides,
      });
    