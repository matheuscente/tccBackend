import type { NextFunction, Request, Response } from "express";
import { httpSuccessResponse } from "../../../shared/controller/httpSuccessResponse.util";
import { AuthorizationError } from "../../../shared/errors/authorization.error";
import type { IAdminController } from "../interfaces/controllers/admin-controller.interface";
import type { IAdminService } from "../interfaces/services/admin-service.interface";

export class AdminController implements IAdminController {

    constructor(
        private readonly service: IAdminService
    ) { }

    dashboard = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const authUser = req.user

            if (!authUser) throw new AuthorizationError("Usuário não autenticado")

            const dashboard = await this.service.getDashboard()

            res.status(200).json(httpSuccessResponse(200, dashboard))

        } catch (err) {
            next(err)
        }
    }

    userOverview = async (req: Request<{ id: string }>, res: Response, next: NextFunction): Promise<void> => {
        try {
            const authUser = req.user
            const { id } = req.params

            if (!authUser) throw new AuthorizationError("Usuário não autenticado")

            const overview = await this.service.getUserOverview(id)

            res.status(200).json(httpSuccessResponse(200, overview))

        } catch (err) {
            next(err)
        }
    }
}
