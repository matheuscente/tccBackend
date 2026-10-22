import type { FileTokenKind } from "../DTOs/file-token-kind.DTO"
import type { FileTokenPayloadDTO } from "../DTOs/file-token-payload.DTO"

export interface IFileTokenService {
    sign(payload: FileTokenPayloadDTO): string
    verify(token: string, kind: FileTokenKind): FileTokenPayloadDTO
}
