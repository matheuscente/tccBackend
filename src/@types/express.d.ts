import type { AuthUserDTO } from "../shared/DTOs/auth-user.DTO"

declare global {
  namespace Express {
    interface Request {
      user?: AuthUserDTO
    }
  }
}
