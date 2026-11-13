import type { FileTokenKind } from "./file-token-kind.DTO"

export interface FileTokenPayloadDTO {
    sub: string
    kind: FileTokenKind
}
