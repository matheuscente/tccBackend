import { PrismaClient, type User } from "../../../../generated/prisma/client.js";
import type { CreateUserDTO } from "../DTOs/create-user.dto.js";
import type { UpdateUserDTO } from "../DTOs/update-user.dto.js";
import type { IUserRepository } from "../interfaces/user-repository.interface.js";

export class UserRepository implements IUserRepository {
    constructor(private orm: PrismaClient) {}

    async create(data: CreateUserDTO): Promise<User> {
        return this.orm.user.create({data})
    }

    async findById(id: string): Promise<User | null> {
        return this.orm.user.findUnique({where: {id} })
    }

    async findByUsername(username: string): Promise<User | null> {
        return this.orm.user.findUnique({where: {username}})
    }

    async update(id: string, data: UpdateUserDTO): Promise<User> {
        return this.orm.user.update({
            where: {id},
            data
        })
    }

    async softDelete(id: string): Promise<void> {
        await this.orm.user.update({
            where: { id },
            data: {deletedAt: new Date() }
        })
    }
    
}