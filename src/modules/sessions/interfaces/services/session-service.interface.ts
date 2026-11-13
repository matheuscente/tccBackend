import type { SessionResponseDTO } from "../../DTOs/session-response.DTO"
import type { ValidateSessionResponseDTO } from "../../DTOs/validate-session-response.DTO"

export interface ISessionService {
    createSession(userId: string): Promise<SessionResponseDTO>

    refreshSession(refreshToken: string): Promise<SessionResponseDTO>

    invalidateSession(sessionId: string): Promise<void>

    invalidateAllByUserId(userId: string): Promise<void>

    validateSession(sessionId: string): Promise<ValidateSessionResponseDTO>

}