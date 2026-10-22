import type { FileScopeDTO } from "./file-scope.DTO"

export interface UpdateFileDTO extends FileScopeDTO {
    originalName?: string
}
