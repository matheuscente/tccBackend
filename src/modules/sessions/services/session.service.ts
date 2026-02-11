import type { IHashUtils } from "../../../shared/hash/interfaces/hash-utils.interface";
import type { RefreshSessionResponseDTO } from "../DTOs/refresh-session-response.DTO";
import type { SessionTokenResponseDTO } from "../DTOs/session-token-response.DTO";
import type { ISessionRepository } from "../interfaces/session-repository.interface";
import type { ISessionService } from "../interfaces/session-service.interface";

export class SessionService implements ISessionService {

        constructor(
        private readonly repository: ISessionRepository,
        private readonly hash: IHashUtils
    ) {}

    async createSession(userId: string): Promise<SessionTokenResponseDTO> {
        const rawRefreshToken = crypto.randomUUID()

        const hashedRefreshToken = await this.hash.hashPassword(rawRefreshToken)

        const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 7)

        await this.repository.create({
            userId,
            refreshToken: hashedRefreshToken,
            expiresAt
        })

        return {
            refreshToken: hashedRefreshToken,
            expiresAt
        }
    }
    refreshSession(refreshToken: string): Promise<RefreshSessionResponseDTO> {
        throw new Error("Method not implemented.");
    }
    invalidateSession(sessionId: string): Promise<void> {
        throw new Error("Method not implemented.");
    }
}