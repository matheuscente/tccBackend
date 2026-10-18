import type { NextFunction, Request, Response } from "express";
import { httpSuccessResponse } from "../../../shared/controller/httpSuccessResponse.util";
import { AuthorizationError } from "../../../shared/errors/authorization.error";
import type { StatsQueryDTO } from "../DTOs/get-stats.DTO";
import type { IStatsService } from "../interfaces/services/stats-service.interface";

export class StatsController {
    constructor(private readonly service: IStatsService) { }

    summary = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            if (!req.user) throw new AuthorizationError("Usuário não autenticado")
            const query = req.query as unknown as StatsQueryDTO
            const summary = await this.service.getSummary(req.user, { ...query, userId: query.userId ?? req.user.id })
            res.status(200).json(httpSuccessResponse(200, summary))
        } catch (err) {
            next(err)
        }
    }

    goals = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            if (!req.user) throw new AuthorizationError("Usuário não autenticado")
            const userId = typeof req.query.userId === "string" ? req.query.userId : req.user.id
            const progress = await this.service.getGoalsProgress(req.user, userId)
            res.status(200).json(httpSuccessResponse(200, progress))
        } catch (err) {
            next(err)
        }
    }

    performance = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            if (!req.user) throw new AuthorizationError("Usuário não autenticado")
            const query = req.query as unknown as StatsQueryDTO
            const performance = await this.service.getPerformance(req.user, { ...query, userId: query.userId ?? req.user.id })
            res.status(200).json(httpSuccessResponse(200, performance))
        } catch (err) {
            next(err)
        }
    }
}
