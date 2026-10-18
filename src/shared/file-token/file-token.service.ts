import jwt from "jsonwebtoken";
import { AuthorizationError } from "../errors/authorization.error";

export type FileTokenKind = "file" | "attachment"

export interface FileTokenPayload {
    sub: string
    kind: FileTokenKind
}

export interface IFileTokenService {
    sign(payload: FileTokenPayload): string
    verify(token: string, kind: FileTokenKind): FileTokenPayload
}

/**
 * Tokens de curta duração para abrir arquivos direto no navegador
 * (<video>, <img>, <iframe> não enviam o header Authorization).
 */
export class FileTokenService implements IFileTokenService {
    constructor(
        private readonly secret: string,
        private readonly expiresInSeconds = 60 * 30
    ) { }

    sign(payload: FileTokenPayload): string {
        return jwt.sign(payload, this.secret, { algorithm: "HS256", expiresIn: this.expiresInSeconds })
    }

    verify(token: string, kind: FileTokenKind): FileTokenPayload {
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
