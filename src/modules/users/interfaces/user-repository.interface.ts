import type { CreateUserDTO } from "../DTOs/create-user.dto";
import type {User} from "@prisma/client"
import type { UpdateUserDTO } from "../DTOs/update-user.dto";
import type { UserResponseDTO } from "../DTOs/user-response.dto";
import type { UserResponseWithPasswordDTO } from "../DTOs/user-response-password.DTO";

export interface IUserRepository {
    create(data: CreateUserDTO): Promise<UserResponseDTO> 
    findById(id:string): Promise<UserResponseDTO | null>
    findByUsername(username: string): Promise<UserResponseDTO | null>
    update(id: string, data: UpdateUserDTO): Promise<UserResponseDTO>
    updatePassword(
        id: string,
        newPassword: string
    ): Promise<void>
    softDelete(id: string): Promise<void>
    getUserWithPassword(username: string): Promise<UserResponseWithPasswordDTO | null>
}