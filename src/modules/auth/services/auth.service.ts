import type { IDateConvert } from "../../../routes/convert/interfaces/date-convert.interface";
import { ValidationError } from "../../../shared/errors/validation-error";
import type { IHashUtils } from "../../../shared/hash/interfaces/hash-utils.interface";
import type { ISessionService } from "../../sessions/interfaces/session-service.interface";
import type { IUserService } from "../../users/interfaces/user-service.interface";
import type { AuthResponseDTO } from "../DTOs/auth-response.dto";
import type { LoginDTO } from "../DTOs/login.dto";
import type { IAuthService } from "../interfaces/auth-service.interface";

export class AuthService implements IAuthService {
    constructor(
        private readonly userService: IUserService,
        private readonly sessionService: ISessionService,
        private readonly hash: IHashUtils,
        private readonly dateConvert: IDateConvert
    ) {}

    async login(data: LoginDTO): Promise<AuthResponseDTO> {
        const user = await this.userService.findWithPassword(data.username)

        if(!user) throw new ValidationError("usuário ou senha inválidos")

        const isTruePassword = await this.hash.compare(data.password, user.username)

        if(!isTruePassword) throw new ValidationError("usuário ou senha inválidos")

        const session = await this.sessionService.createSession(user.id)

        const expiresAt = this.dateConvert.dateToSeconds(session.expiresAt)

        //const token = await this.accessToken.create()

        return {
            accessToken: "123",
            refreshToken: session.refreshToken,
            expiresAt
        }

    }

    async logout(accessToken: string): Promise<void> {

    }

    async refreshSession(refreshToken: string): Promise<AuthResponseDTO> {
        throw new Error("Method not implemented.");
    }
}