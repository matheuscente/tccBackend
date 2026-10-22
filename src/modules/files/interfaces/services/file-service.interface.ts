import type { StoredFile } from "@prisma/client"
import type { AuthUserDTO } from "../../../../shared/DTOs/auth-user.DTO"
import type { FileAccessDTO } from "../../DTOs/file-access.DTO"
import type { FileFilterDTO } from "../../DTOs/file-filter.DTO"
import type { FileScopeDTO } from "../../DTOs/file-scope.DTO"
import type { ResponseFileDTO } from "../../DTOs/response-file.DTO"
import type { UpdateFileDTO } from "../../DTOs/update-file.DTO"
import type { UploadedFileDTO } from "../../DTOs/uploaded-file.DTO"

export interface IFileService {
    upload(authUser: AuthUserDTO, file: UploadedFileDTO | undefined, scope: FileScopeDTO): Promise<ResponseFileDTO>
    findById(authUser: AuthUserDTO, fileId: string): Promise<ResponseFileDTO>
    findAllByUserId(authUser: AuthUserDTO, targetUserId: string, filter: FileFilterDTO): Promise<ResponseFileDTO[]>
    update(authUser: AuthUserDTO, fileId: string, data: UpdateFileDTO): Promise<ResponseFileDTO>
    delete(authUser: AuthUserDTO, fileId: string): Promise<void>
    createAccess(authUser: AuthUserDTO, fileId: string): Promise<FileAccessDTO>
    resolveByToken(token: string): Promise<StoredFile>
}
