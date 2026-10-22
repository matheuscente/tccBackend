import type { NextFunction, Request, Response } from "express";
import { httpSuccessResponse } from "../../../shared/controller/httpSuccessResponse.util";
import { AuthorizationError } from "../../../shared/errors/authorization.error";
import type { IStorageProvider } from "../../../shared/storage/interfaces/storage-provider.interface";
import { streamFile } from "../../../shared/storage/utils/stream-file.util";
import type { FileScopeDTO } from "../DTOs/file-scope.DTO";
import type { UpdateFileDTO } from "../DTOs/update-file.DTO";
import type { FileFilterDTO } from "../DTOs/file-filter.DTO";
import type { IFileController } from "../interfaces/controllers/file-controller.interface";
import type { IFileService } from "../interfaces/services/file-service.interface";

export class FileController implements IFileController {

    constructor(
        private readonly service: IFileService,
        private readonly storage: IStorageProvider
    ) { }

    upload = async (req: Request<any, any, FileScopeDTO>, res: Response, next: NextFunction): Promise<void> => {
        try {
            const authUser = req.user
            const scope = req.body ?? {}

            if (!authUser) throw new AuthorizationError("Usuário não autenticado")

            const file = await this.service.upload(authUser, req.file, scope)

            res.status(201).json(httpSuccessResponse(201, file))

        } catch (err) {
            next(err)
        }
    }

    findById = async (req: Request<{ id: string }>, res: Response, next: NextFunction): Promise<void> => {
        try {
            const authUser = req.user
            const { id } = req.params

            if (!authUser) throw new AuthorizationError("Usuário não autenticado")

            const file = await this.service.findById(authUser, id)

            res.status(200).json(httpSuccessResponse(200, file))

        } catch (err) {
            next(err)
        }
    }

    findAllByUserId = async (req: Request<{ userId: string }, any, any, FileFilterDTO>, res: Response, next: NextFunction): Promise<void> => {
        try {
            const authUser = req.user
            const { userId } = req.params
            const filter = req.query

            if (!authUser) throw new AuthorizationError("Usuário não autenticado")

            const files = await this.service.findAllByUserId(authUser, userId, filter)

            res.status(200).json(httpSuccessResponse(200, files))

        } catch (err) {
            next(err)
        }
    }

    update = async (req: Request<{ id: string }, any, UpdateFileDTO>, res: Response, next: NextFunction): Promise<void> => {
        try {
            const authUser = req.user
            const { id } = req.params
            const data = req.body

            if (!authUser) throw new AuthorizationError("Usuário não autenticado")

            const file = await this.service.update(authUser, id, data)

            res.status(200).json(httpSuccessResponse(200, file))

        } catch (err) {
            next(err)
        }
    }

    delete = async (req: Request<{ id: string }>, res: Response, next: NextFunction): Promise<void> => {
        try {
            const authUser = req.user
            const { id } = req.params

            if (!authUser) throw new AuthorizationError("Usuário não autenticado")

            await this.service.delete(authUser, id)

            res.status(204).send()

        } catch (err) {
            next(err)
        }
    }

    createAccess = async (req: Request<{ id: string }>, res: Response, next: NextFunction): Promise<void> => {
        try {
            const authUser = req.user
            const { id } = req.params

            if (!authUser) throw new AuthorizationError("Usuário não autenticado")

            const access = await this.service.createAccess(authUser, id)

            res.status(200).json(httpSuccessResponse(200, access))

        } catch (err) {
            next(err)
        }
    }

    // rota pública: o acesso é validado pelo token temporário gerado em createAccess
    content = async (req: Request<{ id: string }>, res: Response, next: NextFunction): Promise<void> => {
        try {
            const { id } = req.params
            const token = typeof req.query.token === "string" ? req.query.token : ""
            const download = req.query.download === "1"

            const file = await this.service.resolveByToken(token)

            if (file.id !== id) throw new AuthorizationError("Link do arquivo inválido ou expirado")

            await streamFile(req, res, this.storage, file, download)

        } catch (err) {
            next(err)
        }
    }
}
