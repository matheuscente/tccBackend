import type { PrismaClient, Session } from "@prisma/client";
import type { CreateSessionDTO } from "../../sessions/DTOs/create-session.DTO";
import type { ISessionRepository } from "../interfaces/repositories/session-repository.interface";


export class SessionRepository implements ISessionRepository {
    constructor(private readonly orm: PrismaClient) {}

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
    
    async findById(id: string): Promise<Session | null> {
         return this.orm.session.findUnique({
            where: {
                id
            }
        })
    }

    async create(data: CreateSessionDTO): Promise<Session> {
        return this.orm.session.create({
            data
        })
    }

    async findByUserId(id: string): Promise<Session[]> {
         return this.orm.session.findMany({
            where: {
                userId: id,
            }
        })
    }

    async invalidate(sessionId: string): Promise<void> {
        await this.orm.session.updateMany({
            where: {
                id: sessionId
            },
            data: {
                isValid: false
            }
        })
    }

    async invalidateAllByUserId(userId: string): Promise<void> {
        await this.orm.session.updateMany({
            where: { userId },
            data: { isValid: false }
  })
}
    
}