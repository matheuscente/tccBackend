import type { NextFunction, Request, Response } from "express";
import type { UserRole } from "../../modules/users/types/user-role.type";
import { AuthorizationError } from "../../shared/errors/authorization.error";
import { ForbiddenError } from "../../shared/errors/forbidden.error";

// deve ser usado depois do middleware de autenticação
export const requireRole = (...roles: UserRole[]) => {
    return (req: Request, _res: Response, next: NextFunction) => {
        if (!req.user) return next(new AuthorizationError("Usuário não autenticado"))

        if (!roles.includes(req.user.role)) return next(new ForbiddenError("Acesso restrito"))

        return next()
    }
}
