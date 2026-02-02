import type { CreateUserDTO } from "../DTOs/create-user.dto";
import type {User} from "../../../../generated/prisma/client"
import type { UpdateUserDTO } from "../DTOs/update-user.dto";

export interface IUserRepository {
    create(data: CreateUserDTO): Promise<User> 
    findById(id:string): Promise<User | null>
    findByUsername(username: string): Promise<User | null>
    update(id: string, data: UpdateUserDTO): Promise<User>
    updatePassword(
        id: string, 
        oldPassword: string,
        newPassword: string
    ): Promise<void>
    softDelete(id: string): Promise<void>
}