import type { UserRole } from "../types/user-role.type";

export interface CreateUserDTO {
    name: string,
    username: string,
    password: string,
    birthDate: string,
    role: UserRole
}