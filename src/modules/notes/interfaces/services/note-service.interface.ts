import type { AuthUserDTO } from "../../../../shared/DTOs/auth-user.DTO"
import type { CreateNoteDTO } from "../../DTOs/create-note.DTO"
import type { UpdateNoteDTO } from "../../DTOs/update-note.DTO"
import type { NoteFilterDTO } from "../../DTOs/note-filter.DTO"
import type { ResponseNoteDTO } from "../../DTOs/response-note.DTO"

export interface INoteService {
    create(authUser: AuthUserDTO, data: CreateNoteDTO): Promise<ResponseNoteDTO>
    findById(authUser: AuthUserDTO, noteId: string): Promise<ResponseNoteDTO | null>
    findAllByUserId(authUser: AuthUserDTO, targetUserId: string, filter: NoteFilterDTO): Promise<ResponseNoteDTO[]>
    update(authUser: AuthUserDTO, noteId: string, data: UpdateNoteDTO): Promise<ResponseNoteDTO>
    softDelete(authUser: AuthUserDTO, noteId: string): Promise<void>
}
