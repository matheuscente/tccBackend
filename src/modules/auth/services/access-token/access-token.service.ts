import type { ResponseAccessTokenDTO } from "../../DTOs/response-access-token.dto";
import type { GenerateAccessTokenDTO } from "../../DTOs/generate-access-token.dto";

import type { IAccessTokenService } from "../../interfaces/access-token/access-token-service.interface";
import jwt from "jsonwebtoken"

export class AccessTokenService implements IAccessTokenService {
    constructor(
        private readonly secret: string
    ) {}

    generateAccessToken( 
        data: GenerateAccessTokenDTO
    ): string {

        const payload = {
            sub: data.sub,
            sessionId: data.sessionId
        }

        return jwt.sign(payload, this.secret, {
            algorithm: "HS256",
            expiresIn: "15m"
        })
    }

    extractPayload(accessToken: string): ResponseAccessTokenDTO {
    const decoded = jwt.verify(accessToken, this.secret, {
        algorithms: ["HS256"]
    });

    if (typeof decoded === "string") {
        throw new Error("fomato de payload do token inválido");
    }

    return decoded as ResponseAccessTokenDTO;
}
}