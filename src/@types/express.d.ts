import type { UserRole } from "../modules/users/types/user-role.type"
import type { AuthUserDTO } from "../shared/DTOs/auth-user.DTO"

    /**
     * Declare the type USER in the global request type.
     */
    declare global {
  namespace Express {
    interface Request {
      user?: AuthUserDTO
    }
  }
}