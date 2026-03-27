import type { Request, Response, NextFunction } from "express";
import type { CreateStudySessionDTO } from "../../DTOs/start-study-session.DTO";
import type { UpdateStudySessionDTO } from "../../DTOs/update-study-session.DTO";

export interface IStudySessionController {

    create(req: Request<any, any, CreateStudySessionDTO>, res: Response, next: NextFunction): Promise<void>

    findById(req: Request<{ id: string }>, res: Response, next: NextFunction): Promise<void>

    findAllByUserId(req: Request<any, any, any, { userId: string }>, res: Response, next: NextFunction): Promise<void>

    update(req: Request<{ id: string }, any, UpdateStudySessionDTO>, res: Response, next: NextFunction): Promise<void>

    delete(req: Request<{ id: string }>, res: Response, next: NextFunction): Promise<void>

}