import type { NextFunction, Request, Response } from "express";
import { httpSuccessResponse } from "../../../shared/controller/httpSuccessResponse.util";
import { AuthorizationError } from "../../../shared/errors/authorization.error";
import { NotFoundError } from "../../../shared/errors/not-found-error";
import type { CreateActivityDTO } from "../DTOs/create-activity.DTO";
import type { UpdateActivityDTO } from "../DTOs/update-activity.DTO";
import type { SetActivityQuestionsDTO } from "../DTOs/set-activity-questions.DTO";
import type { SubmitAttemptDTO } from "../DTOs/submit-attempt.DTO";
import type { IActivityController } from "../interfaces/controllers/activity-controller.interface";
import type { IActivityService } from "../interfaces/services/activity-service.interface";

export class ActivityController implements IActivityController {

    constructor(
        private readonly service: IActivityService
    ) { }

    create = async (req: Request<any, any, CreateActivityDTO>, res: Response, next: NextFunction): Promise<void> => {
        try {
            const authUser = req.user
            const data = req.body

            if (!authUser) throw new AuthorizationError("Usuário não autenticado")

            const activity = await this.service.create(authUser, data)

            res.status(201).json(httpSuccessResponse(201, activity))

        } catch (err) {
            next(err)
        }
    }

    findById = async (req: Request<{ id: string }>, res: Response, next: NextFunction): Promise<void> => {
        try {
            const authUser = req.user
            const { id } = req.params

            if (!authUser) throw new AuthorizationError("Usuário não autenticado")

            const activity = await this.service.findById(authUser, id)

            if (!activity) throw new NotFoundError("Atividade não encontrada")

            res.status(200).json(httpSuccessResponse(200, activity))

        } catch (err) {
            next(err)
        }
    }

    findAllByUserId = async (req: Request<{ userId: string }>, res: Response, next: NextFunction): Promise<void> => {
        try {
            const authUser = req.user
            const { userId } = req.params

            if (!authUser) throw new AuthorizationError("Usuário não autenticado")

            const activities = await this.service.findAllByUserId(authUser, userId)

            res.status(200).json(httpSuccessResponse(200, activities))

        } catch (err) {
            next(err)
        }
    }

    update = async (req: Request<{ id: string }, any, UpdateActivityDTO>, res: Response, next: NextFunction): Promise<void> => {
        try {
            const authUser = req.user
            const { id } = req.params
            const data = req.body

            if (!authUser) throw new AuthorizationError("Usuário não autenticado")

            const activity = await this.service.update(authUser, id, data)

            res.status(200).json(httpSuccessResponse(200, activity))

        } catch (err) {
            next(err)
        }
    }

    setQuestions = async (req: Request<{ id: string }, any, SetActivityQuestionsDTO>, res: Response, next: NextFunction): Promise<void> => {
        try {
            const authUser = req.user
            const { id } = req.params
            const { questionIds } = req.body

            if (!authUser) throw new AuthorizationError("Usuário não autenticado")

            const activity = await this.service.setQuestions(authUser, id, questionIds)

            res.status(200).json(httpSuccessResponse(200, activity))

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

    getForAnswering = async (req: Request<{ id: string }>, res: Response, next: NextFunction): Promise<void> => {
        try {
            const authUser = req.user
            const { id } = req.params

            if (!authUser) throw new AuthorizationError("Usuário não autenticado")

            const activity = await this.service.getForAnswering(authUser, id)

            res.status(200).json(httpSuccessResponse(200, activity))

        } catch (err) {
            next(err)
        }
    }

    submitAttempt = async (req: Request<{ id: string }, any, SubmitAttemptDTO>, res: Response, next: NextFunction): Promise<void> => {
        try {
            const authUser = req.user
            const { id } = req.params
            const data = req.body

            if (!authUser) throw new AuthorizationError("Usuário não autenticado")

            const attempt = await this.service.submitAttempt(authUser, id, data)

            res.status(201).json(httpSuccessResponse(201, attempt))

        } catch (err) {
            next(err)
        }
    }

    findAttempts = async (req: Request<{ id: string }>, res: Response, next: NextFunction): Promise<void> => {
        try {
            const authUser = req.user
            const { id } = req.params

            if (!authUser) throw new AuthorizationError("Usuário não autenticado")

            const attempts = await this.service.findAttempts(authUser, id)

            res.status(200).json(httpSuccessResponse(200, attempts))

        } catch (err) {
            next(err)
        }
    }

    findAttemptById = async (req: Request<{ id: string }>, res: Response, next: NextFunction): Promise<void> => {
        try {
            const authUser = req.user
            const { id } = req.params

            if (!authUser) throw new AuthorizationError("Usuário não autenticado")

            const attempt = await this.service.findAttemptById(authUser, id)

            if (!attempt) throw new NotFoundError("Tentativa não encontrada")

            res.status(200).json(httpSuccessResponse(200, attempt))

        } catch (err) {
            next(err)
        }
    }
}
