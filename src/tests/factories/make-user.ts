import type { User } from "@prisma/client";
import { randomUUID } from "node:crypto";

  export const makeUser = (overrides?: Partial<User>): User => ({
    id: randomUUID(),
    name: "test",
    username: `test ${randomUUID()}`,
    role: "USER",
    birthDate: new Date("2000-01-01"),
    createdAt: new Date(),
    updatedAt: new Date(),
    password: "hashed password",
    deletedAt: null,
    ...overrides,
  });