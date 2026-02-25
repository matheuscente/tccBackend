import type { UserRole } from "../../users/types/user-role.type";

export interface AuthUserDTO {
    id: string,
    role: UserRole

}