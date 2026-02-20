
import { prisma } from "../../../lib/prisma";
import { DateConvert } from "../../../shared/convert/utils/date-convert.utils";
import { HashProvider } from "../../../shared/hash/provider/hash.provider";
import { SessionRepository } from "../../sessions/repositories/session.repository";
import { SessionService } from "../../sessions/services/session.service";
import { UserRepository } from "../../users/repositories/user.repository";
import { AuthController } from "../controllers/auth-controller";
import { AccessTokenService } from "../services/access-token/access-token.service";
import { AuthService } from "../services/auth/auth.service";

export function authFactory(): AuthController {
    const sessionRepository = new SessionRepository(prisma) 
    const userRepository =  new UserRepository(prisma)
    const hash =  new HashProvider(10)
    const sessionService =  new SessionService(sessionRepository, hash)
    const dateConvert = new DateConvert() 
    const accessTokenService = new AccessTokenService("test")
    const authService = new AuthService(userRepository, sessionService, hash, dateConvert, accessTokenService)
    const controller =  new AuthController(authService)

    return controller
}