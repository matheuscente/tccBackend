import type { NextFunction, Request, Response } from "express";
import { httpSuccessResponse } from "../../../shared/controller/httpSuccessResponse.util";
import { AuthorizationError } from "../../../shared/errors/authorization.error";
import { NotFoundError } from "../../../shared/errors/not-found-error";
import type { CreateNoteDTO, NoteFilterDTO, UpdateNoteDTO } from "../DTOs/note.DTO";
import type { INoteService } from "../interfaces/services/note-service.interface";

export class NoteController {
    constructor(private readonly service: INoteService) { }

    create = async (req: Request<any, any, CreateNoteDTO>, res: Response, next: NextFunction): Promise<void> => {
        try {
            if (!req.user) throw new AuthorizationError("Usuário não autenticado")
            const note = await this.service.create(req.user, req.body)
            res.status(201).json(httpSuccessResponse(201, note))
        } catch (err) {
            next(err)
        }
    }

    findById = async (req: Request<{ id: string }>, res: Response, next: NextFunction): Promise<void> => {
        try {
            if (!req.user) throw new AuthorizationError("Usuário não autenticado")
            const note = await this.service.findById(req.user, req.params.id)
            if (!note) throw new NotFoundError("Nota não encontrada")
            res.status(200).json(httpSuccessResponse(200, note))
        } catch (err) {
            next(err)
        }
    }

    findAllByUserId = async (req: Request<{ userId: string }>, res: Response, next: NextFunction): Promise<void> => {
        try {
            if (!req.user) throw new AuthorizationError("Usuário não autenticado")
            const notes = await this.service.findAllByUserId(req.user, req.params.userId, req.query as NoteFilterDTO)
            res.status(200).json(httpSuccessResponse(200, notes))
        } catch (err) {
            next(err)
        }
    }

    update = async (req: Request<{ id: string }, any, UpdateNoteDTO>, res: Response, next: NextFunction): Promise<void> => {
        try {
            if (!req.user) throw new AuthorizationError("Usuário não autenticado")
            const note = await this.service.update(req.user, req.params.id, req.body)
            res.status(200).json(httpSuccessResponse(200, note))
        } catch (err) {
            next(err)
        }
    }

    softDelete = async (req: Request<{ id: string }>, res: Response, next: NextFunction): Promise<void> => {
        try {
            if (!req.user) throw new AuthorizationError("Usuário não autenticado")
            await this.service.softDelete(req.user, req.params.id)
            res.status(204).send()
        } catch (err) {
            next(err)
        }
    }
}
