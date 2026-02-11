import type { PrismaClient, Session } from "@prisma/client";
import type { CreateSessionDTO } from "../DTOs/create-session.dto";
import type { ISessionRepository } from "../interfaces/session-repository.interface";


export class SessionRepository implements ISessionRepository {
    constructor(private readonly orm: PrismaClient) {}

    async create(data: CreateSessionDTO): Promise<Session> {
        return this.orm.session.create({
            data
        })
    }

    async findByRefreshToken(refreshToken: string): Promise<Session | null> {
        return this.orm.session.findUnique({
            where: {
                refreshToken
            }
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
    
}