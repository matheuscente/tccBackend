import type { NextFunction, Request, Response } from "express";
import { httpSuccessResponse } from "../../../shared/controller/httpSuccessResponse.util";
import { AuthorizationError } from "../../../shared/errors/authorization.error";
import { NotFoundError } from "../../../shared/errors/not-found-error";
import type { CreateNoteDTO } from "../DTOs/create-note.DTO";
import type { UpdateNoteDTO } from "../DTOs/update-note.DTO";
import type { NoteFilterDTO } from "../DTOs/note-filter.DTO";
import type { INoteController } from "../interfaces/controllers/note-controller.interface";
import type { INoteService } from "../interfaces/services/note-service.interface";

export class NoteController implements INoteController {

    constructor(
        private readonly service: INoteService
    ) { }

    create = async (req: Request<any, any, CreateNoteDTO>, res: Response, next: NextFunction): Promise<void> => {
        try {
            const authUser = req.user
            const data = req.body

            if (!authUser) throw new AuthorizationError("Usuário não autenticado")

            const note = await this.service.create(authUser, data)

            res.status(201).json(httpSuccessResponse(201, note))

        } catch (err) {
            next(err)
        }
    }

    findById = async (req: Request<{ id: string }>, res: Response, next: NextFunction): Promise<void> => {
        try {
            const authUser = req.user
            const { id } = req.params

            if (!authUser) throw new AuthorizationError("Usuário não autenticado")

            const note = await this.service.findById(authUser, id)

            if (!note) throw new NotFoundError("Nota não encontrada")

            res.status(200).json(httpSuccessResponse(200, note))

        } catch (err) {
            next(err)
        }
    }

    findAllByUserId = async (req: Request<{ userId: string }, any, any, NoteFilterDTO>, res: Response, next: NextFunction): Promise<void> => {
        try {
            const authUser = req.user
            const { userId } = req.params
            const filter = req.query

            if (!authUser) throw new AuthorizationError("Usuário não autenticado")

            const notes = await this.service.findAllByUserId(authUser, userId, filter)

            res.status(200).json(httpSuccessResponse(200, notes))

        } catch (err) {
            next(err)
        }
    }

    update = async (req: Request<{ id: string }, any, UpdateNoteDTO>, res: Response, next: NextFunction): Promise<void> => {
        try {
            const authUser = req.user
            const { id } = req.params
            const data = req.body

            if (!authUser) throw new AuthorizationError("Usuário não autenticado")

            const note = await this.service.update(authUser, id, data)

            res.status(200).json(httpSuccessResponse(200, note))

        } catch (err) {
            next(err)
        }
    }

    softDelete = async (req: Request<{ id: string }>, res: Response, next: NextFunction): Promise<void> => {
        try {
            const authUser = req.user
            const { id } = req.params

            if (!authUser) throw new AuthorizationError("Usuário não autenticado")

            await this.service.softDelete(authUser, id)

            res.status(204).send()

        } catch (err) {
            next(err)
        }
    }
}
