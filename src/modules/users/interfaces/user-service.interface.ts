import type { User } from "@prisma/client";
import type { CreateUserDTO } from "../DTOs/create-user.dto";
import type { UpdateUserDTO } from "../DTOs/update-user.dto";
import type { UserResponseDTO } from "../DTOs/user-response.dto";

export interface IUserService {
    create(data: CreateUserDTO): Promise<UserResponseDTO> 
    findById(id:string): Promise<UserResponseDTO | null>
    findByUsername(username: string): Promise<UserResponseDTO | null>
    update(id: string, data: UpdateUserDTO): Promise<UserResponseDTO>
    updatePassword(
        id: string, 
        oldPassword: string,
        newPassword: string
    ): Promise<void>
    softDelete(id: string): Promise<void>
    findWithPassword(username: string): Promise<Partial<Pick<User, "password" | "username">> | null>
}