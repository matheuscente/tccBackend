import type { StoredFile } from "@prisma/client"
import type { CreateFileRepositoryDTO, FileFilterDTO } from "../../DTOs/file.DTO"

export interface IFileRepository {
    create(data: CreateFileRepositoryDTO): Promise<StoredFile>
    findById(fileId: string): Promise<StoredFile | null>
    findAllByUserId(userId: string, filter?: FileFilterDTO): Promise<StoredFile[]>
    update(fileId: string, data: Partial<Pick<StoredFile, "originalName" | "courseId" | "moduleId" | "disciplineId">>): Promise<StoredFile>
    delete(fileId: string): Promise<void>
    sumSizeByUserId(userId: string): Promise<number>
}
