import type { CreateCourseDTO } from "../../DTOs/create-course.DTO";
import type { NextFunction } from "express";
import type { Request, Response } from "express";

export interface ICourseController {
  create(req: Request<any, any, CreateCourseDTO>, res: Response, next: NextFunction): Promise<void>;
  
  findById(req: Request<{id: string}>, res: Response, next: NextFunction): Promise<void>;
  
  findAllByUserId(req: Request<any, any, any, {userId: string}>, res: Response, next: NextFunction): Promise<void>;
  
  update(req: Request<{id: string}, any, Partial<Omit<CreateCourseDTO, "userId">>>, res: Response, next: NextFunction): Promise<void>;
  
  softDelete(req: Request<{id: string}>, res: Response, next: NextFunction): Promise<void>;
}