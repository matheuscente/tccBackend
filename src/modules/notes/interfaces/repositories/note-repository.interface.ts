import type { Note } from "@prisma/client"
import type { CreateNoteRepositoryDTO } from "../../DTOs/create-note-repository.DTO"
import type { UpdateNoteRepositoryDTO } from "../../DTOs/update-note-repository.DTO"
import type { NoteFilterDTO } from "../../DTOs/note-filter.DTO"

export interface INoteRepository {
    create(data: CreateNoteRepositoryDTO): Promise<Note>
    findById(noteId: string): Promise<Note | null>
    findAllByUserId(userId: string, filter?: NoteFilterDTO): Promise<Note[]>
    update(noteId: string, data: UpdateNoteRepositoryDTO): Promise<Note>
    softDelete(noteId: string): Promise<void>
}
