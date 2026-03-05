import type { User } from "@prisma/client";
import type { AuthUserDTO } from "../../modules/courses/DTOs/auth-user.DTO";

export interface IOwnershipService {
  resolveOwnerId(
    authUser: AuthUserDTO,
    userId?: string
  ): Promise<string>

  validateOwnership(
    user: Pick<User, "id" | "role">,
    ownerId: string,
  ): void

  validateStrictOwnership(
    user: Pick<User, "id">,
    ownerId: string,
  ): void
}