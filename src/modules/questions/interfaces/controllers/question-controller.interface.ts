import type { NextFunction, Request, Response } from "express"
import type { CreateQuestionDTO, UpdateQuestionDTO } from "../../DTOs/create-question.DTO"

export interface IQuestionController {
    create(req: Request<any, any, CreateQuestionDTO>, res: Response, next: NextFunction): Promise<void>
    findById(req: Request<{ id: string }>, res: Response, next: NextFunction): Promise<void>
    findAllByUserId(req: Request<{ userId: string }>, res: Response, next: NextFunction): Promise<void>
    update(req: Request<{ id: string }, any, UpdateQuestionDTO>, res: Response, next: NextFunction): Promise<void>
    softDelete(req: Request<{ id: string }>, res: Response, next: NextFunction): Promise<void>
}
