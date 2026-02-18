import type { User } from "@prisma/client";

  export const makeUser = (overrides?: Partial<User>): User => ({
    id: "1",
    name: "test",
    username: "test",
    role: "USER",
    birthDate: new Date("2000-01-01"),
    createdAt: new Date(),
    updatedAt: new Date(),
    password: "hashed password",
    deletedAt: null,
    ...overrides,
  });