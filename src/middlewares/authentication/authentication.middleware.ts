import type { NextFunction, Request, Response } from "express";
import type { IAccessTokenService } from "../../modules/auth/interfaces/access-token/access-token-service.interface";
import type { ISessionService } from "../../modules/sessions/interfaces/services/session-service.interface";
import { AuthorizationError } from "../../shared/errors/authorization.error";

// token inválido ou expirado responde 401: é o status que faz o frontend renovar a sessão pelo refresh token
export const authenticationMiddleware = (
    accessTokenService: IAccessTokenService,
    sessionService: ISessionService
) => {

    return async (req: Request, res: Response, next: NextFunction) => {
        try {
            const requestHeader = req.headers.authorization

            if (!requestHeader || !requestHeader.startsWith("Bearer ")) throw new AuthorizationError("Access token inválido ou não informado")

            const accessToken = requestHeader.split(" ")[1]

            if (!accessToken) throw new AuthorizationError("Access token inválido ou não informado")

            let payload;

            try {
                payload = accessTokenService.extractPayload(accessToken)
            } catch {
                throw new AuthorizationError("Token inválido ou expirado")
            }

            if (!payload) throw new AuthorizationError("Token inválido ou expirado")

            const session = await sessionService.validateSession(payload.sessionId)

            if (session.userId !== payload.sub) {
                throw new AuthorizationError("Sessão inválida")
            }

            req.user = {
                id: session.userId,
                role: session.userRole,
                sessionId: payload.sessionId
            }

            return next()

        } catch (err) {
            next(err)
        }
    }
}
