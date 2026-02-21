import type { NextFunction, Request, Response } from "express";
import type { IAccessTokenService } from "../../modules/auth/interfaces/access-token/access-token-service.interface";
import type { ISessionService } from "../../modules/sessions/interfaces/services/session-service.interface";
import { AuthorizationError } from "../../shared/errors/authorization.error";

export const authenticationMiddleware = (
    accessTokenService: IAccessTokenService,
    sessionService: ISessionService
) => {

    return async (req: Request, res: Response, next: NextFunction) => {
        try {

            //extrai o header da requisição
            const requestHeader =  req.headers.authorization

            //verifica se o token está no formato bearer
            if(!requestHeader || !requestHeader.startsWith("Bearer ")) throw new AuthorizationError("Access token inválido ou não informado")

            //salva o token
            const accessToken = requestHeader.split(" ")[1]

            //verifica se o token foi informado
            if(!accessToken) throw new AuthorizationError("Access token inválido ou não informado")

            //valida e extrai o payload do token
            const payload = accessTokenService.extractPayload(accessToken)

            //busca session e verifica se existe e é valida
            const session = await sessionService.validateSession(payload.sessionId)

            //compara o id de usuario do payload do token e da session, para ver se é o mesmo
            if(session.userId !== payload.sub) {
                throw new AuthorizationError("Sessão inváida")
            }

            //autentica o usuário na requisição
            req.user = {
                id: session.userId,
                role: session.userRole,
                sessionId: payload.sessionId
            }

            return next()

        } catch(err) {

            next(err)

        }
    }
}