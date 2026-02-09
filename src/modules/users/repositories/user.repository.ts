import { PrismaClient, type User } from "@prisma/client";
import type { CreateUserDTO } from "../DTOs/create-user.dto";
import type { UpdateUserDTO } from "../DTOs/update-user.dto";
import type { IUserRepository } from "../interfaces/user-repository.interface";

export class UserRepository implements IUserRepository {
    constructor(private orm: PrismaClient) {}

    async updatePassword(id: string, newPassword: string): Promise<void> {
        await this.orm.user.update({
            where: {id,
                deletedAt: null
            },
            
             data: {password: newPassword}
        })
    }

    async create(data: CreateUserDTO): Promise<User> {
        return this.orm.user.create({data})
    }

    async findById(id: string): Promise<User | null> {
        return this.orm.user.findFirst({where: {id, deletedAt: null} })
    }

    async findByUsername(username: string): Promise<User | null> {
        return this.orm.user.findFirst({where: {username, deletedAt: null}})
    }

    async update(id: string, data: UpdateUserDTO): Promise<User> {

        return this.orm.user.update({
            where: {id,
                deletedAt: null
            },
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