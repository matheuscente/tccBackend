import type { Prisma, PrismaClient, StoredFile } from "@prisma/client";
import type { CreateFileRepositoryDTO, FileFilterDTO } from "../DTOs/file.DTO";
import type { IFileRepository } from "../interfaces/repositories/file-repository.interface";

export class FileRepository implements IFileRepository {
    constructor(private readonly orm: PrismaClient | Prisma.TransactionClient) { }

    create(data: CreateFileRepositoryDTO): Promise<StoredFile> {
        return this.orm.storedFile.create({ data })
    }

    findById(fileId: string): Promise<StoredFile | null> {
        return this.orm.storedFile.findUnique({ where: { id: fileId } })
    }

    findAllByUserId(userId: string, filter: FileFilterDTO = {}): Promise<StoredFile[]> {
        return this.orm.storedFile.findMany({
            where: {
                userId,
                ...this.scopeWhere(filter),
                ...(filter.search ? { originalName: { contains: filter.search, mode: "insensitive" } } : {})
            },
            orderBy: { createdAt: "desc" }
        })
    }

    update(fileId: string, data: Partial<Pick<StoredFile, "originalName" | "courseId" | "moduleId" | "disciplineId">>): Promise<StoredFile> {
        return this.orm.storedFile.update({ where: { id: fileId }, data })
    }

    async delete(fileId: string): Promise<void> {
        await this.orm.storedFile.deleteMany({ where: { id: fileId } })
    }

    async sumSizeByUserId(userId: string): Promise<number> {
        const result = await this.orm.storedFile.aggregate({ where: { userId }, _sum: { size: true } })
        return result._sum.size ?? 0
    }

    private scopeWhere(filter: FileFilterDTO): Prisma.StoredFileWhereInput {
        if (filter.disciplineId) return { disciplineId: filter.disciplineId }
        if (filter.moduleId) return { OR: [{ moduleId: filter.moduleId }, { discipline: { moduleId: filter.moduleId } }] }
        if (filter.courseId) return {
            OR: [
                { courseId: filter.courseId },
                { module: { courseId: filter.courseId } },
                { discipline: { module: { courseId: filter.courseId } } }
            ]
        }
        return {}
    }
}
