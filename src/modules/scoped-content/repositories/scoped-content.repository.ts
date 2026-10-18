import type { Prisma, PrismaClient } from "@prisma/client";
import type { IScopedContentRepository } from "../interfaces/scoped-content-repository.interface";

type ScopeFilter = {
    OR: Array<Record<string, unknown>>
}

export class ScopedContentRepository implements IScopedContentRepository {
    constructor(private readonly orm: PrismaClient | Prisma.TransactionClient) { }

    async cleanupByCourseIds(courseIds: string[]): Promise<void> {
        if (courseIds.length === 0) return
        await this.cleanup({
            OR: [
                { courseId: { in: courseIds } },
                { module: { courseId: { in: courseIds } } },
                { discipline: { module: { courseId: { in: courseIds } } } }
            ]
        })
    }

    async cleanupByModuleIds(moduleIds: string[]): Promise<void> {
        if (moduleIds.length === 0) return
        await this.cleanup({
            OR: [
                { moduleId: { in: moduleIds } },
                { discipline: { moduleId: { in: moduleIds } } }
            ]
        })
    }

    async cleanupByDisciplineIds(disciplineIds: string[]): Promise<void> {
        if (disciplineIds.length === 0) return
        await this.cleanup({ OR: [{ disciplineId: { in: disciplineIds } }] })
    }

    async cleanupByUserId(userId: string): Promise<void> {
        const now = new Date()
        await this.orm.activity.updateMany({ where: { userId, deletedAt: null }, data: { deletedAt: now } })
        await this.orm.question.updateMany({ where: { userId, deletedAt: null }, data: { deletedAt: now } })
        await this.orm.note.updateMany({ where: { userId, deletedAt: null }, data: { deletedAt: now } })
    }

    private async cleanup(filter: ScopeFilter): Promise<void> {
        const now = new Date()
        const detach = { courseId: null, moduleId: null, disciplineId: null }

        await this.orm.activity.updateMany({
            where: { deletedAt: null, ...filter } as Prisma.ActivityWhereInput,
            data: { deletedAt: now }
        })

        await this.orm.question.updateMany({
            where: { deletedAt: null, ...filter } as Prisma.QuestionWhereInput,
            data: { deletedAt: now }
        })

        await this.orm.note.updateMany({
            where: filter as Prisma.NoteWhereInput,
            data: detach
        })

        await this.orm.storedFile.updateMany({
            where: filter as Prisma.StoredFileWhereInput,
            data: detach
        })
    }
}
