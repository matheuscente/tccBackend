import { Prisma, PrismaClient, type User } from "@prisma/client";
import type { CreateUserDTO } from "../DTOs/create-user.dto";
import type { UpdateUserDTO } from "../DTOs/update-user.dto";
import type { IUserRepository } from "../interfaces/user-repository.interface";
import type { ListUsersQueryDTO } from "../DTOs/list-users-query.dto";

export class UserRepository implements IUserRepository {
    constructor(private orm: PrismaClient | Prisma.TransactionClient) {}

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
    

    async findByEmail(email: string): Promise<User | null> {
        return this.orm.user.findFirst({ where: { email, deletedAt: null } })
    }

    async findMany(query: ListUsersQueryDTO): Promise<{ items: User[], total: number }> {
        const page = query.page ?? 1
        const pageSize = query.pageSize ?? 20

        const where: Prisma.UserWhereInput = {
            deletedAt: null,
            ...(query.search ? {
                OR: [
                    { name: { contains: query.search, mode: "insensitive" } },
                    { username: { contains: query.search, mode: "insensitive" } },
                    { email: { contains: query.search, mode: "insensitive" } },
                ]
            } : {})
        }

        const [items, total] = await Promise.all([
            this.orm.user.findMany({
                where,
                orderBy: { createdAt: "desc" },
                skip: (page - 1) * pageSize,
                take: pageSize
            }),
            this.orm.user.count({ where })
        ])

        return { items, total }
    }

    async updateRole(id: string, role: User["role"]): Promise<User> {
        return this.orm.user.update({
            where: { id, deletedAt: null },
            data: { role }
        })
    }
}
