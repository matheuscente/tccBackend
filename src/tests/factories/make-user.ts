import { randomUUID } from "node:crypto";
import type { UserWithAllProps } from "../../shared/convert/utils/user-with-all-props";

  export const makeUser = (overrides?: Partial<UserWithAllProps>): UserWithAllProps => ({
    id: randomUUID(),
    name: "test",
    username: `test ${randomUUID()}`,
    role: "USER",
    birthDate: 31102001,
    createdAt: 123,
    updatedAt: 123,
    password: "hashed password",
    deletedAt: undefined,
    ...overrides,
  });