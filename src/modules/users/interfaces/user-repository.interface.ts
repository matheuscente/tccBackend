import type { CreateUserDTO } from "../DTOs/create-user.dto";
import type {User} from "@prisma/client"
import type { UpdateUserDTO } from "../DTOs/update-user.dto";
import type { ListUsersQueryDTO } from "../DTOs/list-users-query.dto";

export interface IUserRepository {
    create(data: CreateUserDTO): Promise<User> 
    findById(id:string): Promise<User | null>
    findByUsername(username: string): Promise<User | null>
    findByEmail(email: string): Promise<User | null>
    update(id: string, data: UpdateUserDTO): Promise<User>
    updatePassword(
        id: string,
        newPassword: string
    ): Promise<void>
    softDelete(id: string): Promise<void>
    findMany(query: ListUsersQueryDTO): Promise<{ items: User[], total: number }>
    updateRole(id: string, role: User["role"]): Promise<User>
}
