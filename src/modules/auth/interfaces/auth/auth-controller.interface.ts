import type { NextFunction, Request, Response } from "express";
import type { LoginDTO } from "../../DTOs/login.dto";
import type { ForgotPasswordDTO } from "../../DTOs/forgot-password.DTO";
import type { ResetPasswordDTO } from "../../DTOs/reset-password.DTO";

export interface IAuthController {
  login(req: Request<any, any, LoginDTO>, res: Response, next: NextFunction): Promise<void>;
  logout(req: Request, res: Response, next: NextFunction): Promise<void>;
  refreshSession(req: Request, res: Response, next: NextFunction): Promise<void>;
  forgotPassword(req: Request<any, any, ForgotPasswordDTO>, res: Response, next: NextFunction): Promise<void>;
  resetPassword(req: Request<any, any, ResetPasswordDTO>, res: Response, next: NextFunction): Promise<void>;
}
