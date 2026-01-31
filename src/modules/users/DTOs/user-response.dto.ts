import type { UserRole } from "../types/user-role.type.js";

export interface UserResponseDTO {
    id: string,
    name: string,
    username: string,
    role: UserRole,
    createdAt: Date,
    updatedAt: Date

}