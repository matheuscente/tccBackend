import express, {type Request, type Response, type NextFunction} from "express"
import { ValidationError } from "../shared/errors/validation-error"
import { NotFoundError } from "../shared/errors/not-found-error"
import { InternalServerError } from "../shared/errors/internal-server-error"
import { isCelebrateError } from "celebrate"
import { AuthorizationError } from "../shared/errors/authorization.error"
import CelebrateValidationError from "../shared/errors/celebrate-validation.error"
import { MulterError } from "multer"
import { Prisma } from "@prisma/client"

export abstract class ErrorHandler {
    static handler(app: express.Express) {
        app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
            if (res.headersSent) return next(err)

            if(isCelebrateError(err)) {
                new CelebrateValidationError(err).send(res)
                return
            }

            if (err instanceof MulterError) {
                const message = err.code === "LIMIT_FILE_SIZE"
                    ? "O arquivo excede o tamanho máximo permitido"
                    : err.code === "LIMIT_FILE_COUNT" || err.code === "LIMIT_UNEXPECTED_FILE"
                        ? "Quantidade de arquivos acima do permitido"
                        : "Erro no envio do arquivo"
                new ValidationError(message).send(res)
                return
            }

            if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
                new ValidationError("Já existe um registro com esses dados").send(res)
                return
            }

            // registro removido entre a leitura e a escrita (update/delete sem resultado)
            if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2025") {
                new NotFoundError("Registro não encontrado").send(res)
                return
            }

            if (err instanceof SyntaxError && "body" in err) {
                new ValidationError("JSON inválido").send(res)
                return
            }

            if(!(err instanceof ValidationError || err instanceof NotFoundError || err instanceof AuthorizationError)) {
                console.error(err)
                new InternalServerError().send(res)
                return
            } else {
                err.send(res)
                return
            }
        })
    }
}
