import type { NextFunction, Request, Response } from "express"

export interface IAdminController {
    dashboard(req: Request, res: Response, next: NextFunction): Promise<void>

    userOverview(req: Request<{ id: string }>, res: Response, next: NextFunction): Promise<void>
}
