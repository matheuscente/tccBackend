import type { Session } from "@prisma/client";
import type { CreateSessionDTO } from "../DTOs/session-token-response.DTO";

export interface ISessionRepository {
    create(data: CreateSessionDTO): Promise<Session>

    findByRefreshToken(refreshToken: string): Promise<Session | null>

    findByUserId(id: string): Promise<Session[]>

    invalidate(sessionId: string): Promise<void>
}