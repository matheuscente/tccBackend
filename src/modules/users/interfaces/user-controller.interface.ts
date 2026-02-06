import type { NextFunction } from "express";
import type { Request, Response } from "express";

export interface IUserController {
    create(req: Request, res: Response, next: NextFunction): Promise<void>
    findById(req: Request, res: Response, next: NextFunction): Promise<void>
    findByUsername(req: Request, res: Response, next: NextFunction): Promise<void>
    softDelete(req: Request, res: Response, next: NextFunction): Promise<void>
    update(req: Request, res: Response, next: NextFunction): Promise<void>
    updatePassword(req: Request, res: Response, next: NextFunction): Promise<void>
}