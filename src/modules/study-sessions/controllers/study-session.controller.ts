import type { Request, Response, NextFunction } from "express";
import type { CreateStudySessionDTO } from "../DTOs/create-study-session.DTO";
import type { UpdateStudySessionDTO } from "../DTOs/update-study-session.DTO";
import type { IStudySessionController } from "../interfaces/controllers/study-session-controller.interface";
import type { IStudySessionService } from "../interfaces/services/study-sessions-service.interface";
import { AuthorizationError } from "../../../shared/errors/authorization.error";

export class StudySessionController implements IStudySessionController {

    constructor(
        private readonly service: IStudySessionService
    ) {}

    create = async (req: Request<any, any, CreateStudySessionDTO>, res: Response, next: NextFunction): Promise<void> => {
        try {
            const authUser = req.user
            const data = req.body

            if (!authUser) throw new AuthorizationError("Usuário não autenticado")

            const goal = await this.service.create(authUser, data)

            res.status(201).json({ data: goal })

        } catch (err) {
            next(err)
        }
    }

    findById = async (req: Request<{ id: string }>, res: Response, next: NextFunction): Promise<void> => {
        try {
            const authUser = req.user
            const { id } = req.params

            if (!authUser) throw new AuthorizationError("Usuário não autenticado")

            const goal = await this.service.findById(authUser, id)

            if (!goal) {
                res.status(204).send()
                return
            }

            res.status(200).json({ data: goal })

        } catch (err) {
            next(err)
        }
    }

    findAllByUserId = async (req: Request<{ userId: string }>, res: Response, next: NextFunction): Promise<void> => {
        try {
            const authUser = req.user
            const { userId } = req.params

            if (!authUser) throw new AuthorizationError("Usuário não autenticado")

            const goals = await this.service.findAllByUserId(authUser, userId)

            if (goals.length === 0) {
                res.status(204).send()
                return
            }

            res.status(200).json({ data: goals })

        } catch (err) {
            next(err)
        }
    }

    update = async (req: Request<{ id: string }, any, UpdateStudySessionDTO>, res: Response, next: NextFunction): Promise<void> => {
        try {
            const authUser = req.user
            const { id } = req.params
            const data = req.body

            if (!authUser) throw new AuthorizationError("Usuário não autenticado")

            const updatedStudySession = await this.service.update(authUser, id, data)

            res.status(200).json({ data: updatedStudySession })

        } catch (err) {
            next(err)
        }
    }

    delete = async (req: Request<{ id: string }>, res: Response, next: NextFunction): Promise<void> => {
        try {
            const authUser = req.user
            const { id } = req.params

            if (!authUser) throw new AuthorizationError("Usuário não autenticado")

            await this.service.delete(authUser, id)

            res.status(204).send()

        } catch (err) {
            next(err)
        }
    }

}