import express, {type Response, type Request, type NextFunction} from "express";
import { NotFoundError } from "../shared/errors/not-found-error.js";

export abstract class PageNotFoundMiddleware {
    static pageNotFound(app: express.Express) {
        app.use((req: Request, res: Response, next: NextFunction) => {
            next(new NotFoundError('página não encontrada'))
        })
    }
}