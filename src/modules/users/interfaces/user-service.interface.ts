import type { CreateUserDTO } from "../DTOs/create-user.dto";
import type { UpdateUserDTO } from "../DTOs/update-user.dto";
import type { UserResponseDTO } from "../DTOs/user-response.dto";
import type { ListUsersQueryDTO } from "../DTOs/list-users-query.dto";
import type { PaginatedUsersDTO } from "../DTOs/paginated-users.dto";
import type { UserRole } from "../types/user-role.type";
import type { AuthUserDTO } from "../../../shared/DTOs/auth-user.DTO";

export interface IUserService {
    create(data: CreateUserDTO): Promise<UserResponseDTO> 
    findById(authUser: AuthUserDTO, id:string): Promise<UserResponseDTO | null>
    findByUsername(authUser: AuthUserDTO, username: string): Promise<UserResponseDTO | null>
    update(authUser: AuthUserDTO, id: string, data: UpdateUserDTO): Promise<UserResponseDTO>
    updatePassword(authUser: AuthUserDTO, 
        id: string, 
        oldPassword: string,
        newPassword: string
    ): Promise<void>
    softDelete(authUser: AuthUserDTO, id: string): Promise<void>
    getMe(authUser: AuthUserDTO): Promise<UserResponseDTO>
    list(authUser: AuthUserDTO, query: ListUsersQueryDTO): Promise<PaginatedUsersDTO<UserResponseDTO>>
    updateRole(authUser: AuthUserDTO, id: string, role: UserRole): Promise<UserResponseDTO>
}