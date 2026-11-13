import jwt from "jsonwebtoken";
import { AuthorizationError } from "../../errors/authorization.error";
import type { FileTokenKind } from "../DTOs/file-token-kind.DTO";
import type { FileTokenPayloadDTO } from "../DTOs/file-token-payload.DTO";
import type { IFileTokenService } from "../interfaces/file-token-service.interface";

// tokens de curta duração para abrir arquivos direto no navegador (<video>, <img> e <iframe> não enviam o header Authorization)
export class FileTokenService implements IFileTokenService {
    constructor(
        private readonly secret: string,
        private readonly expiresInSeconds = 60 * 30
    ) { }

    sign(payload: FileTokenPayloadDTO): string {
        return jwt.sign(payload, this.secret, { algorithm: "HS256", expiresIn: this.expiresInSeconds })
    }

    verify(token: string, kind: FileTokenKind): FileTokenPayloadDTO {
        try {
            const decoded = jwt.verify(token, this.secret, { algorithms: ["HS256"] })

            if (typeof decoded === "string" || decoded.kind !== kind || typeof decoded.sub !== "string") {
                throw new Error("payload inválido")
            }

            return { sub: decoded.sub, kind }
        } catch {
            throw new AuthorizationError("Link do arquivo inválido ou expirado")
        }
    }
}
