import type { UserRole } from "../modules/users/types/user-role.type"

    /**
     * Declare the type USER in the global request type.
     */
    declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string
        role: UserRole
        sessionId: string
      }
    }
  }
}