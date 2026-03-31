import type { Request, Response, NextFunction } from "express";
import type { StartStudySessionDTO } from "../../DTOs/start-study-session.DTO";
import type { UpdateStudySessionDTO } from "../../DTOs/update-study-session.DTO";

export interface IStudySessionController {
    start(req: Request<any, any, StartStudySessionDTO>, res: Response, next: NextFunction): Promise<void>
    finish(req: Request<{ id: string }>, res: Response, next: NextFunction): Promise<void>
    findById(req: Request<{ id: string }>, res: Response, next: NextFunction): Promise<void>
    findAllByUserId(req: Request<{ userId: string }>, res: Response, next: NextFunction): Promise<void>
    update(req: Request<{ id: string }, any, UpdateStudySessionDTO>, res: Response, next: NextFunction): Promise<void>
    delete(req: Request<{ id: string }>, res: Response, next: NextFunction): Promise<void>
}