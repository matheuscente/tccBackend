import type { User } from "@prisma/client";
import type { CreateUserDTO } from "../DTOs/create-user.dto";
import type { UpdateUserDTO } from "../DTOs/update-user.dto";
import type { UserResponseDTO } from "../DTOs/user-response.dto";
import type { AuthUserDTO } from "../../courses/DTOs/auth-user.DTO";

export interface IUserService {
    create(data: CreateUserDTO): Promise<UserResponseDTO> 
    findById(authUser:AuthUserDTO, id: string): Promise<UserResponseDTO | null>
    findByUsername(authUser: AuthUserDTO, username: string): Promise<UserResponseDTO | null>
    update(authUser:AuthUserDTO, id: string, data: UpdateUserDTO): Promise<UserResponseDTO>
    updatePassword(
        authUser: AuthUserDTO, 
        id: string, 
        oldPassword: string,
        newPassword: string
    ): Promise<void>
    softDelete(authUser: AuthUserDTO, id: string): Promise<void>
}