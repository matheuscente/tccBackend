import type { Request, Response, NextFunction } from "express";
import type { CreateGoalDTO } from "../../DTOs/create-goal.DTO";
import type { UpdateGoalDTO } from "../../DTOs/update-goal.DTO";

export interface IGoalController {

    create(req: Request<any, any, CreateGoalDTO>, res: Response, next: NextFunction): Promise<void>

    findById(req: Request<{ id: string }>, res: Response, next: NextFunction): Promise<void>

    findAllByUserId(req: Request<any, any, any, { userId: string }>, res: Response, next: NextFunction): Promise<void>

    update(req: Request<{ id: string }, any, UpdateGoalDTO>, res: Response, next: NextFunction): Promise<void>

    delete(req: Request<{ id: string }>, res: Response, next: NextFunction): Promise<void>

}