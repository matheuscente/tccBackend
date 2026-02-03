import type { UserRole } from "../types/user-role.type";

export interface UserResponseDTO {
    id: string,
    name: string,
    username: string,
    role: UserRole,
    birthDate: Date,
    createdAt: Date,
    updatedAt: Date

}