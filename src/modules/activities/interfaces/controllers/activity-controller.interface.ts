import type { NextFunction, Request, Response } from "express"
import type { CreateActivityDTO } from "../../DTOs/create-activity.DTO"
import type { UpdateActivityDTO } from "../../DTOs/update-activity.DTO"
import type { SetActivityQuestionsDTO } from "../../DTOs/set-activity-questions.DTO"
import type { SubmitAttemptDTO } from "../../DTOs/submit-attempt.DTO"

export interface IActivityController {
    create(req: Request<any, any, CreateActivityDTO>, res: Response, next: NextFunction): Promise<void>

    findById(req: Request<{ id: string }>, res: Response, next: NextFunction): Promise<void>

    findAllByUserId(req: Request<{ userId: string }>, res: Response, next: NextFunction): Promise<void>

    update(req: Request<{ id: string }, any, UpdateActivityDTO>, res: Response, next: NextFunction): Promise<void>

    setQuestions(req: Request<{ id: string }, any, SetActivityQuestionsDTO>, res: Response, next: NextFunction): Promise<void>

    softDelete(req: Request<{ id: string }>, res: Response, next: NextFunction): Promise<void>

    getForAnswering(req: Request<{ id: string }>, res: Response, next: NextFunction): Promise<void>

    submitAttempt(req: Request<{ id: string }, any, SubmitAttemptDTO>, res: Response, next: NextFunction): Promise<void>

    findAttempts(req: Request<{ id: string }>, res: Response, next: NextFunction): Promise<void>

    findAttemptById(req: Request<{ id: string }>, res: Response, next: NextFunction): Promise<void>
}
