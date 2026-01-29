import express, {type Request, type Response, type NextFunction} from "express"
import { ValidationError } from "../shared/errors/validation-error"
import { NotFoundError } from "../shared/errors/not-found-error"
import { InternalServerError } from "../shared/errors/internal-server-error"
import { errors } from "celebrate"

export abstract class ErrorHandler {
    static handler(app: express.Express) {
        app.use(errors())
        app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
            if(!(err instanceof ValidationError || err instanceof NotFoundError)) {
                new InternalServerError().send(res)
            } else {
                err.send(res)
            }
        })
    }
}