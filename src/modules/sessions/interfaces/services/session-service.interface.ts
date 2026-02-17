import type { SessionResponseDTO } from "../../DTOs/session-response.DTO"

export interface ISessionService {
    createSession(userId: string): Promise<SessionResponseDTO>

    refreshSession(refreshToken: string): Promise<SessionResponseDTO>

    invalidateSession(sessionId: string): Promise<void>

}