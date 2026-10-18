import type { NextFunction, Request, Response } from "express";
import { httpSuccessResponse } from "../../../shared/controller/httpSuccessResponse.util";
import type { IAdminService } from "../interfaces/admin-repository.interface";

export class AdminController {
    constructor(private readonly service: IAdminService) { }

    dashboard = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const dashboard = await this.service.getDashboard()
            res.status(200).json(httpSuccessResponse(200, dashboard))
        } catch (err) {
            next(err)
        }
    }

    userOverview = async (req: Request<{ id: string }>, res: Response, next: NextFunction): Promise<void> => {
        try {
            const overview = await this.service.getUserOverview(req.params.id)
            res.status(200).json(httpSuccessResponse(200, overview))
        } catch (err) {
            next(err)
        }
    }
}
