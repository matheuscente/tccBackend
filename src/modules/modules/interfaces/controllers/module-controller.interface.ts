import type { NextFunction, Request, Response } from "express";
import type { CreateModuleDTO } from "../../DTOs/create-module.dto";

export interface IModuleController {
    create(req: Request<any, any, CreateModuleDTO>, res: Response, next: NextFunction): Promise<void>;
  
    findById(req: Request<{id: string}>, res: Response, next: NextFunction): Promise<void>;

    findAllByCourseId(req: Request<any, any, any, {courseId: string}>, res: Response, next: NextFunction): Promise<void>;
  
    findAllByUserId(req: Request<any, any, any, {userId: string}>, res: Response, next: NextFunction): Promise<void>;
  
    update(req: Request<{id: string}, any, Partial<CreateModuleDTO>>, res: Response, next: NextFunction): Promise<void>;
  
    softDelete(req: Request<{id: string}>, res: Response, next: NextFunction): Promise<void>;
}