import type { StoredFile } from "@prisma/client"
import type { CreateFileRepositoryDTO } from "../../DTOs/create-file-repository.DTO"
import type { UpdateFileRepositoryDTO } from "../../DTOs/update-file-repository.DTO"
import type { FileFilterDTO } from "../../DTOs/file-filter.DTO"

export interface IFileRepository {
    create(data: CreateFileRepositoryDTO): Promise<StoredFile>
    findById(fileId: string): Promise<StoredFile | null>
    findAllByUserId(userId: string, filter?: FileFilterDTO): Promise<StoredFile[]>
    update(fileId: string, data: UpdateFileRepositoryDTO): Promise<StoredFile>
    delete(fileId: string): Promise<void>
    sumSizeByUserId(userId: string): Promise<number>
}
