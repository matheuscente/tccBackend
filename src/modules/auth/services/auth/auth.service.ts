import type { IDateConvert } from "../../../../shared/convert/interfaces/date-convert.interface"
import { AuthorizationError } from "../../../../shared/errors/authorization.error"
import { NotFoundError } from "../../../../shared/errors/not-found-error"
import { ValidationError } from "../../../../shared/errors/validation-error"
import type { IHashProvider } from "../../../../shared/hash/interfaces/hash-provider.interface"
import type { ISessionService } from "../../../sessions/interfaces/services/session-service.interface"
import type { IUserRepository } from "../../../users/interfaces/user-repository.interface"
import type { AuthResponseDTO } from "../../DTOs/auth-response.dto"
import type { LoginDTO } from "../../DTOs/login.dto"
import type { IAccessTokenService } from "../../interfaces/access-token/access-token-service.interface"
import type { IAuthService } from "../../interfaces/auth/auth-service.interface"


export class AuthService implements IAuthService {
    constructor(
        private readonly userRepository: IUserRepository,
        private readonly sessionService: ISessionService,
        private readonly hash: IHashProvider,
        private readonly dateConvert: IDateConvert,
        private readonly accessTokenService: IAccessTokenService
    ) {}

    async login(data: LoginDTO): Promise<AuthResponseDTO> {
        const user = await this.userRepository.findByUsername(data.username)

        if(!user) throw new AuthorizationError("usuário ou senha inválidos")

        const isTruePassword = await this.hash.compare(data.password, user.password)

        if(!isTruePassword) throw new AuthorizationError("usuário ou senha inválidos")

        const session = await this.sessionService.createSession(user.id)

        const expiresAt = this.dateConvert.dateToSeconds(session.expiresAt)

        const token = this.accessTokenService.generateAccessToken({
            sub: user.id,
            sessionId: session.id,
        })

        return {
            accessToken: token,
            refreshToken: {
                token: session.refreshToken,
                expiresAt: expiresAt
            }
        }

    }

    async logout(accessToken: string): Promise<void> {

        const payload = this.accessTokenService.extractPayload(accessToken)

        try {
            await this.sessionService.invalidateSession(payload.sessionId)

        } catch (err){
            if(err instanceof NotFoundError) {
                throw new AuthorizationError("sessão inválida")
            }

            throw err
        }
    }

    async refreshSession(refreshToken: string): Promise<AuthResponseDTO> {

        const session = await this.sessionService.refreshSession(refreshToken)

        const expiresInSeconds = this.dateConvert.dateToSeconds(session.expiresAt)

        const accessToken = this.accessTokenService.generateAccessToken({
            sub: session.userId,
            sessionId: session.id
        })

        return {
            accessToken,
            refreshToken: {
                token: session.refreshToken,
                expiresAt: expiresInSeconds
            }
        }
    }
}