import type { NextFunction, Request, Response } from "express"
import type { StatsQueryDTO } from "../../DTOs/stats-query.DTO"
import type { StatsUserQueryDTO } from "../../DTOs/stats-user-query.DTO"

export interface IStatsController {
    summary(req: Request<any, any, any, Partial<StatsQueryDTO>>, res: Response, next: NextFunction): Promise<void>

    goals(req: Request<any, any, any, StatsUserQueryDTO>, res: Response, next: NextFunction): Promise<void>

    performance(req: Request<any, any, any, Partial<StatsQueryDTO>>, res: Response, next: NextFunction): Promise<void>
}
