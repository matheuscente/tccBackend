import type { NextFunction } from "express";
import type { Request, Response } from "express";
import type { UpdateUserDTO } from "../DTOs/update-user.dto";
import type { CreateUserDTO } from "../DTOs/create-user.dto";

export interface IUserController {
    create(req: Request<any, any, CreateUserDTO>, res: Response, next: NextFunction): Promise<void>
    findById(req: Request<any, any, any, {id: string}>, res: Response, next: NextFunction): Promise<void>
    findByUsername(req: Request<any, any, any, {username: string}>, res: Response, next: NextFunction): Promise<void>
    softDelete(req: Request<any, any, any, {id: string}>, res: Response, next: NextFunction): Promise<void>
    update(req: Request<any, any, UpdateUserDTO, {id: string}>, res: Response, next: NextFunction): Promise<void>
    updatePassword(req: Request<any, any , {oldPassword: string, newPassword: string}, {id: string}>, res: Response, next: NextFunction): Promise<void>
}