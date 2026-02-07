import type { Request, Response, NextFunction } from "express";
import type { IUserController } from "../interfaces/user-controller.interface";

export class UserController implements IUserController {
    updatePassword(req: Request, res: Response, next: NextFunction): Promise<void> {
        throw new Error("Method not implemented.");
    }
    create(req: Request, res: Response, next: NextFunction): Promise<void> {
        throw new Error("Method not implemented.");
    }
    findById(req: Request, res: Response, next: NextFunction): Promise<void> {
        throw new Error("Method not implemented.");
    }
    findByUsername(req: Request, res: Response, next: NextFunction): Promise<void> {
        throw new Error("Method not implemented.");
    }
    softDelete(req: Request, res: Response, next: NextFunction): Promise<void> {
        throw new Error("Method not implemented.");
    }
    update(req: Request, res: Response, next: NextFunction): Promise<void> {
        throw new Error("Method not implemented.");
    }
    
}