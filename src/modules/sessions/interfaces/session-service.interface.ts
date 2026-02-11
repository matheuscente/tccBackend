import type { RefreshSessionResponseDTO } from "../DTOs/refresh-session-response.DTO"
import type { SessionTokenResponseDTO } from "../DTOs/session-token-response.DTO"

export interface ISessionService {
    createSession(userId: string): Promise<SessionTokenResponseDTO>

    refreshSession(refreshToken: string): Promise<RefreshSessionResponseDTO>

    invalidateSession(sessionId: string): Promise<void>

}