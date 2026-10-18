import type { NextFunction, Request, Response } from "express";
import { httpSuccessResponse } from "../../../shared/controller/httpSuccessResponse.util";
import { AuthorizationError } from "../../../shared/errors/authorization.error";
import { NotFoundError } from "../../../shared/errors/not-found-error";
import type { CreateQuestionDTO, UpdateQuestionDTO } from "../DTOs/create-question.DTO";
import type { QuestionScopeFilterDTO } from "../DTOs/question-with-options.DTO";
import type { IQuestionController } from "../interfaces/controllers/question-controller.interface";
import type { IQuestionService } from "../interfaces/services/question-service.interface";

export class QuestionController implements IQuestionController {
    constructor(private readonly service: IQuestionService) { }

    create = async (req: Request<any, any, CreateQuestionDTO>, res: Response, next: NextFunction): Promise<void> => {
        try {
            if (!req.user) throw new AuthorizationError("Usuário não autenticado")

            const question = await this.service.create(req.user, req.body)

            res.status(201).json(httpSuccessResponse(201, question))
        } catch (err) {
            next(err)
        }
    }

    findById = async (req: Request<{ id: string }>, res: Response, next: NextFunction): Promise<void> => {
        try {
            if (!req.user) throw new AuthorizationError("Usuário não autenticado")

            const question = await this.service.findById(req.user, req.params.id)
            if (!question) throw new NotFoundError("Questão não encontrada")

            res.status(200).json(httpSuccessResponse(200, question))
        } catch (err) {
            next(err)
        }
    }

    findAllByUserId = async (req: Request<{ userId: string }>, res: Response, next: NextFunction): Promise<void> => {
        try {
            if (!req.user) throw new AuthorizationError("Usuário não autenticado")

            const filter = req.query as QuestionScopeFilterDTO
            const questions = await this.service.findAllByUserId(req.user, req.params.userId, filter)

            res.status(200).json(httpSuccessResponse(200, questions))
        } catch (err) {
            next(err)
        }
    }

    update = async (req: Request<{ id: string }, any, UpdateQuestionDTO>, res: Response, next: NextFunction): Promise<void> => {
        try {
            if (!req.user) throw new AuthorizationError("Usuário não autenticado")

            const question = await this.service.update(req.user, req.params.id, req.body)

            res.status(200).json(httpSuccessResponse(200, question))
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
