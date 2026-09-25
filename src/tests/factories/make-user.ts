import { randomUUID } from "node:crypto";
import type { UserWithAllProps } from "../../shared/convert/utils/user-with-all-props";
import type { UserResponseDTO } from "../../modules/users/DTOs/user-response.dto";

  export const makeUser = (overrides?: Partial<UserWithAllProps>): UserWithAllProps => ({
    id: randomUUID(),
    name: "test",
    username: `test ${randomUUID()}`,
    role: "USER",
    birthDate: "31/10/2001",
    createdAt: 123,
    updatedAt: 123,
    password: "hashed password",
    deletedAt: undefined,
    ...overrides,
  });