import type { Session } from "@prisma/client";
import type { CreateSessionDTO } from "../DTOs/create-session.dto";

export interface ISessionRepository {
    create(data: CreateSessionDTO): Promise<Session>

    findByRefreshToken(refreshToken: string): Promise<Session | null>

    findByUserId(id: string): Promise<Session[]>

    invalidate(sessionId: string): Promise<void>
}