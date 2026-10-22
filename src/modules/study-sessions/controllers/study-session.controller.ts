import { NotFoundError } from "../../../shared/errors/not-found-error";
import { httpSuccessResponse } from "../../../shared/controller/httpSuccessResponse.util";
import type { Request, Response, NextFunction } from "express";
import type { UpdateStudySessionDTO } from "../DTOs/update-study-session.DTO";
import type { IStudySessionController } from "../interfaces/controllers/study-session-controller.interface";
import type { IStudySessionService } from "../interfaces/services/study-sessions-service.interface";
import { AuthorizationError } from "../../../shared/errors/authorization.error";
import type { StartStudySessionDTO } from "../DTOs/start-study-session.DTO";
import type { RegisterStudySessionDTO } from "../DTOs/register-study-session.DTO";

export class StudySessionController implements IStudySessionController {

    constructor(
        private readonly service: IStudySessionService
    ) {}


start = async (req: Request<any, any, StartStudySessionDTO>, res: Response, next: NextFunction): Promise<void> => {
    try {
        const authUser = req.user
        const data = req.body

        if (!authUser) throw new AuthorizationError("Usuário não autenticado")

        const session = await this.service.start(authUser, data)

        res.status(201).json(httpSuccessResponse(201, session))

    } catch (err) {
        next(err)
    }
}

register = async (req: Request<any, any, RegisterStudySessionDTO>, res: Response, next: NextFunction): Promise<void> => {
    try {
        const authUser = req.user
        if (!authUser) throw new AuthorizationError("Usuário não autenticado")

        const session = await this.service.register(authUser, req.body)

        res.status(201).json(httpSuccessResponse(201, session))
    } catch (err) {
        next(err)
    }
}

active = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const authUser = req.user
        if (!authUser) throw new AuthorizationError("Usuário não autenticado")

        const session = await this.service.findActive(authUser)

        res.status(200).json(httpSuccessResponse(200, session ? [session] : []))
    } catch (err) {
        next(err)
    }
}

finish = async (req: Request<{ id: string }>, res: Response, next: NextFunction): Promise<void> => {
    try {
        const authUser = req.user
        const { id } = req.params

        if (!authUser) throw new AuthorizationError("Usuário não autenticado")

        const session = await this.service.finish(authUser, id)

        res.status(200).json(httpSuccessResponse(200, session))

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

            if (!goal) throw new NotFoundError("Registro não encontrado")

            res.status(200).json(httpSuccessResponse(200, goal))

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

            res.status(200).json(httpSuccessResponse(200, goals))

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

            res.status(200).json(httpSuccessResponse(200, updatedStudySession))

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