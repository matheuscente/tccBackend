import type { Prisma, PrismaClient, Session } from "@prisma/client";
import type { CreateSessionDTO } from "../../sessions/DTOs/create-session.DTO";
import type { ISessionRepository } from "../interfaces/repositories/session-repository.interface";
import type { SessionWithUserDTO } from "../DTOs/session-with-user.DTO";


export class SessionRepository implements ISessionRepository {
    constructor(private readonly orm: PrismaClient | Prisma.TransactionClient) {}
    findByIdWithUser(id: string): Promise<SessionWithUserDTO | null> {
        return this.orm.session.findUnique({
            where: { id },
            include: {
                user: {
                    select: {
                        id: true,
                        role: true,
                        deletedAt: true
                    }
                }
            }
        })
    }

    async update(sessionId: string, data: Omit<CreateSessionDTO, "userId">): Promise<void> {
        await this.orm.session.update({
        where: { id: sessionId,
                isValid: true
         },
        data: {
            refreshToken: data.refreshToken,
            expiresAt: data.expiresAt,
            isValid: true
        }
    })
    }
    
    async findById(id: string) {
         return this.orm.session.findUnique({
            where: {
                id
            },
            
        })
    }

    async create(data: CreateSessionDTO) {
        return this.orm.session.create({
            data
        })
    }

    async findByUserId(id: string) {
         return this.orm.session.findMany({
            where: {
                userId: id,
            },
            
        })
    }

    async invalidate(sessionId: string) {
        await this.orm.session.updateMany({
            where: {
                id: sessionId
            },
            data: {
                isValid: false
            }
        })
    }

    async invalidateAllByUserId(userId: string) {
        await this.orm.session.updateMany({
            where: { userId },
            data: { isValid: false }
  })
}
    
}