
import type { NextFunction, Request, Response } from "express";
import type { LoginDTO } from "../../DTOs/login.dto";

export interface IAuthController {
  login(req: Request<any, any, LoginDTO>, res: Response, next: NextFunction): Promise<void>;
  logout(req: Request, res: Response, next: NextFunction): Promise<void>;
  refreshSession(req: Request, res: Response, next: NextFunction): Promise<void>;
}