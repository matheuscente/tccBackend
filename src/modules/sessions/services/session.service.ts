import { NotFoundError } from "../../../shared/errors/not-found-error";
import { ValidationError } from "../../../shared/errors/validation-error";
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
    async invalidateSession(sessionId: string): Promise<void> {
        const session = await this.repository.findById(sessionId)

       if(!session) throw new NotFoundError("sessão não encontrada")

        await this.repository.invalidate(sessionId)
    }
}