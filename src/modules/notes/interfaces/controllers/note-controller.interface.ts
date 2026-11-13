import type { NextFunction, Request, Response } from "express"
import type { CreateNoteDTO } from "../../DTOs/create-note.DTO"
import type { UpdateNoteDTO } from "../../DTOs/update-note.DTO"
import type { NoteFilterDTO } from "../../DTOs/note-filter.DTO"

export interface INoteController {
    create(req: Request<any, any, CreateNoteDTO>, res: Response, next: NextFunction): Promise<void>

    findById(req: Request<{ id: string }>, res: Response, next: NextFunction): Promise<void>

    findAllByUserId(req: Request<{ userId: string }, any, any, NoteFilterDTO>, res: Response, next: NextFunction): Promise<void>

    update(req: Request<{ id: string }, any, UpdateNoteDTO>, res: Response, next: NextFunction): Promise<void>

    softDelete(req: Request<{ id: string }>, res: Response, next: NextFunction): Promise<void>
}
