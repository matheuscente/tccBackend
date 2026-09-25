import type { UserRole } from "../types/user-role.type";

export interface UserResponseDTO {
    id: string,
    name: string,
    username: string,
    role: UserRole,
    birthDate: number | string,
    createdAt: number,
    updatedAt?: number | undefined,
    deletedAt?: number | undefined
}