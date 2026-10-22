import type { NextFunction, Request, Response } from "express";
import { httpSuccessResponse } from "../../../shared/controller/httpSuccessResponse.util";
import { AuthorizationError } from "../../../shared/errors/authorization.error";
import type { StatsQueryDTO } from "../DTOs/stats-query.DTO";
import type { StatsUserQueryDTO } from "../DTOs/stats-user-query.DTO";
import type { IStatsController } from "../interfaces/controllers/stats-controller.interface";
import type { IStatsService } from "../interfaces/services/stats-service.interface";

export class StatsController implements IStatsController {

    constructor(
        private readonly service: IStatsService
    ) { }

    summary = async (req: Request<any, any, any, Partial<StatsQueryDTO>>, res: Response, next: NextFunction): Promise<void> => {
        try {
            const authUser = req.user
            const query = req.query

            if (!authUser) throw new AuthorizationError("Usuário não autenticado")

            const summary = await this.service.getSummary(authUser, { ...query, userId: query.userId ?? authUser.id })

            res.status(200).json(httpSuccessResponse(200, summary))

        } catch (err) {
            next(err)
        }
    }

    goals = async (req: Request<any, any, any, StatsUserQueryDTO>, res: Response, next: NextFunction): Promise<void> => {
        try {
            const authUser = req.user
            const { userId } = req.query

            if (!authUser) throw new AuthorizationError("Usuário não autenticado")

            const progress = await this.service.getGoalsProgress(authUser, userId ?? authUser.id)

            res.status(200).json(httpSuccessResponse(200, progress))

        } catch (err) {
            next(err)
        }
    }

    performance = async (req: Request<any, any, any, Partial<StatsQueryDTO>>, res: Response, next: NextFunction): Promise<void> => {
        try {
            const authUser = req.user
            const query = req.query

            if (!authUser) throw new AuthorizationError("Usuário não autenticado")

            const performance = await this.service.getPerformance(authUser, { ...query, userId: query.userId ?? authUser.id })

            res.status(200).json(httpSuccessResponse(200, performance))

        } catch (err) {
            next(err)
        }
    }
}
