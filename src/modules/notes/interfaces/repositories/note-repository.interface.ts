import type { Note } from "@prisma/client"
import type { CreateNoteRepositoryDTO, NoteFilterDTO } from "../../DTOs/note.DTO"

export interface INoteRepository {
    create(data: CreateNoteRepositoryDTO): Promise<Note>
    findById(noteId: string): Promise<Note | null>
    findAllByUserId(userId: string, filter?: NoteFilterDTO): Promise<Note[]>
    update(noteId: string, data: Partial<Omit<CreateNoteRepositoryDTO, "userId">>): Promise<Note>
    softDelete(noteId: string): Promise<void>
}
