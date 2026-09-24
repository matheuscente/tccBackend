import type { UserRole } from "../types/user-role.type";

export interface UpdateUserDTO {
    name?: string,
    username?: string,
    birthDate?: string | number,
    role?: UserRole
}