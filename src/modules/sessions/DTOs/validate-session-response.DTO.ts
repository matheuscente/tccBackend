import type { UserRole } from "../../users/types/user-role.type";

export interface ValidateSessionResponseDTO {
    userId: string,
    userRole: UserRole
}   