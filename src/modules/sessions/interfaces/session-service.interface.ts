import type { SessionTokenResponseDTO } from "../DTOs/session-token-response.DTO"

export interface ISessionService {
    createSession(userId: string): Promise<SessionTokenResponseDTO>

    refreshSession(refreshToken: string): Promise<SessionTokenResponseDTO>

    invalidateSession(sessionId: string): Promise<void>

}