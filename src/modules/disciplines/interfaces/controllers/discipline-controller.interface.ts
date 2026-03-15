import type { NextFunction, Request, Response } from "express";
import type { CreateDisciplineDTO } from "../../DTOs/create-discipline.DTO";

export interface IDisciplineController {
    create(req: Request<any, any, CreateDisciplineDTO>, res: Response, next: NextFunction): Promise<void>;
  
    findById(req: Request<{id: string}>, res: Response, next: NextFunction): Promise<void>;

    findAllByModuleId(req: Request<any, any, any, {moduleId: string}>, res: Response, next: NextFunction): Promise<void>;
  
    findAllByUserId(req: Request<any, any, any, {userId: string}>, res: Response, next: NextFunction): Promise<void>;
  
    update(req: Request<{id: string}, any, Partial<CreateDisciplineDTO>>, res: Response, next: NextFunction): Promise<void>;
  
    softDelete(req: Request<{id: string}>, res: Response, next: NextFunction): Promise<void>;
}