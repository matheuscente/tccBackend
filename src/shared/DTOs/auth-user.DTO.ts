import type { UserRole } from "../../modules/users/types/user-role.type";

export interface AuthUserDTO {
    id: string,
    role: UserRole,
    sessionId: string
}