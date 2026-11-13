import type { Note, Prisma, PrismaClient } from "@prisma/client";
import type { CreateNoteRepositoryDTO } from "../DTOs/create-note-repository.DTO";
import type { UpdateNoteRepositoryDTO } from "../DTOs/update-note-repository.DTO";
import type { NoteFilterDTO } from "../DTOs/note-filter.DTO";
import type { INoteRepository } from "../interfaces/repositories/note-repository.interface";

export class NoteRepository implements INoteRepository {
    constructor(private readonly orm: PrismaClient | Prisma.TransactionClient) { }

    create(data: CreateNoteRepositoryDTO): Promise<Note> {
        return this.orm.note.create({ data })
    }

    findById(noteId: string): Promise<Note | null> {
        return this.orm.note.findFirst({ where: { id: noteId, deletedAt: null } })
    }

    findAllByUserId(userId: string, filter: NoteFilterDTO = {}): Promise<Note[]> {
        return this.orm.note.findMany({
            where: {
                userId,
                deletedAt: null,
                ...this.scopeWhere(filter),
                ...(filter.search ? {
                    AND: [{
                        OR: [
                            { title: { contains: filter.search, mode: "insensitive" } },
                            { content: { contains: filter.search, mode: "insensitive" } }
                        ]
                    }]
                } : {})
            },
            orderBy: { updatedAt: "desc" }
        })
    }

    update(noteId: string, data: UpdateNoteRepositoryDTO): Promise<Note> {
        return this.orm.note.update({ where: { id: noteId }, data })
    }

    async softDelete(noteId: string): Promise<void> {
        await this.orm.note.updateMany({
            where: { id: noteId, deletedAt: null },
            data: { deletedAt: new Date() }
        })
    }

    private scopeWhere(filter: NoteFilterDTO): Prisma.NoteWhereInput {
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
