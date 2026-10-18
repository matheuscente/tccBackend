import type { NextFunction, Request, Response } from "express";
import { httpSuccessResponse } from "../../../shared/controller/httpSuccessResponse.util";
import { AuthorizationError } from "../../../shared/errors/authorization.error";
import { NotFoundError } from "../../../shared/errors/not-found-error";
import type { CreateActivityDTO, SubmitAttemptDTO, UpdateActivityDTO } from "../DTOs/activity.DTO";
import type { IActivityService } from "../interfaces/services/activity-service.interface";

export class ActivityController {
    constructor(private readonly service: IActivityService) { }

    create = async (req: Request<any, any, CreateActivityDTO>, res: Response, next: NextFunction): Promise<void> => {
        try {
            if (!req.user) throw new AuthorizationError("Usuário não autenticado")
            const activity = await this.service.create(req.user, req.body)
            res.status(201).json(httpSuccessResponse(201, activity))
        } catch (err) {
            next(err)
        }
    }

    findById = async (req: Request<{ id: string }>, res: Response, next: NextFunction): Promise<void> => {
        try {
            if (!req.user) throw new AuthorizationError("Usuário não autenticado")
            const activity = await this.service.findById(req.user, req.params.id)
            if (!activity) throw new NotFoundError("Atividade não encontrada")
            res.status(200).json(httpSuccessResponse(200, activity))
        } catch (err) {
            next(err)
        }
    }

    findAllByUserId = async (req: Request<{ userId: string }>, res: Response, next: NextFunction): Promise<void> => {
        try {
            if (!req.user) throw new AuthorizationError("Usuário não autenticado")
            const activities = await this.service.findAllByUserId(req.user, req.params.userId)
            res.status(200).json(httpSuccessResponse(200, activities))
        } catch (err) {
            next(err)
        }
    }

    update = async (req: Request<{ id: string }, any, UpdateActivityDTO>, res: Response, next: NextFunction): Promise<void> => {
        try {
            if (!req.user) throw new AuthorizationError("Usuário não autenticado")
            const activity = await this.service.update(req.user, req.params.id, req.body)
            res.status(200).json(httpSuccessResponse(200, activity))
        } catch (err) {
            next(err)
        }
    }

    setQuestions = async (req: Request<{ id: string }, any, { questionIds: string[] }>, res: Response, next: NextFunction): Promise<void> => {
        try {
            if (!req.user) throw new AuthorizationError("Usuário não autenticado")
            const activity = await this.service.setQuestions(req.user, req.params.id, req.body.questionIds)
            res.status(200).json(httpSuccessResponse(200, activity))
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

    getForAnswering = async (req: Request<{ id: string }>, res: Response, next: NextFunction): Promise<void> => {
        try {
            if (!req.user) throw new AuthorizationError("Usuário não autenticado")
            const activity = await this.service.getForAnswering(req.user, req.params.id)
            res.status(200).json(httpSuccessResponse(200, activity))
        } catch (err) {
            next(err)
        }
    }

    submitAttempt = async (req: Request<{ id: string }, any, SubmitAttemptDTO>, res: Response, next: NextFunction): Promise<void> => {
        try {
            if (!req.user) throw new AuthorizationError("Usuário não autenticado")
            const attempt = await this.service.submitAttempt(req.user, req.params.id, req.body)
            res.status(201).json(httpSuccessResponse(201, attempt))
        } catch (err) {
            next(err)
        }
    }

    findAttempts = async (req: Request<{ id: string }>, res: Response, next: NextFunction): Promise<void> => {
        try {
            if (!req.user) throw new AuthorizationError("Usuário não autenticado")
            const attempts = await this.service.findAttempts(req.user, req.params.id)
            res.status(200).json(httpSuccessResponse(200, attempts))
        } catch (err) {
            next(err)
        }
    }

    findAttemptById = async (req: Request<{ id: string }>, res: Response, next: NextFunction): Promise<void> => {
        try {
            if (!req.user) throw new AuthorizationError("Usuário não autenticado")
            const attempt = await this.service.findAttemptById(req.user, req.params.id)
            if (!attempt) throw new NotFoundError("Tentativa não encontrada")
            res.status(200).json(httpSuccessResponse(200, attempt))
        } catch (err) {
            next(err)
        }
    }
}
