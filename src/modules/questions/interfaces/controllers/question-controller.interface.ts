import type { NextFunction, Request, Response } from "express"
import type { CreateQuestionDTO } from "../../DTOs/create-question.DTO"
import type { UpdateQuestionDTO } from "../../DTOs/update-question.DTO"
import type { QuestionScopeFilterDTO } from "../../DTOs/question-scope-filter.DTO"

export interface IQuestionController {
    create(req: Request<any, any, CreateQuestionDTO>, res: Response, next: NextFunction): Promise<void>

    findById(req: Request<{ id: string }>, res: Response, next: NextFunction): Promise<void>

    findAllByUserId(req: Request<{ userId: string }, any, any, QuestionScopeFilterDTO>, res: Response, next: NextFunction): Promise<void>

    update(req: Request<{ id: string }, any, UpdateQuestionDTO>, res: Response, next: NextFunction): Promise<void>

    softDelete(req: Request<{ id: string }>, res: Response, next: NextFunction): Promise<void>
}
