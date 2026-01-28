import type { CreateUserDTO } from "../DTOs/create-user.dto.js";
import type {User} from "../../../../generated/prisma/client.js"
import type { UpdateUserDTO } from "../DTOs/update-user.dto.js";

export interface IUserRepository {
    create(data: CreateUserDTO): Promise<User> 
    findById(id:string): Promise<User | null>
    findByUsername(username: string): Promise<User | null>
    update(id: string, data: UpdateUserDTO): Promise<User>
    softDelete(id: string): Promise<void>
}