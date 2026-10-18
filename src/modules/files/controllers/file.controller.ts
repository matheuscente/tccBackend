import type { NextFunction, Request, Response } from "express";
import { httpSuccessResponse } from "../../../shared/controller/httpSuccessResponse.util";
import { AuthorizationError } from "../../../shared/errors/authorization.error";
import type { IStorageProvider } from "../../../shared/storage/storage-provider.interface";
import { streamFile } from "../../../shared/storage/stream-file.util";
import type { FileFilterDTO, FileScopeDTO, UpdateFileDTO } from "../DTOs/file.DTO";
import type { IFileService } from "../interfaces/services/file-service.interface";

export class FileController {
    constructor(
        private readonly service: IFileService,
        private readonly storage: IStorageProvider
    ) { }

    upload = async (req: Request<any, any, FileScopeDTO>, res: Response, next: NextFunction): Promise<void> => {
        try {
            if (!req.user) throw new AuthorizationError("Usuário não autenticado")
            const file = await this.service.upload(req.user, req.file, req.body ?? {})
            res.status(201).json(httpSuccessResponse(201, file))
        } catch (err) {
            next(err)
        }
    }

    findById = async (req: Request<{ id: string }>, res: Response, next: NextFunction): Promise<void> => {
        try {
            if (!req.user) throw new AuthorizationError("Usuário não autenticado")
            const file = await this.service.findById(req.user, req.params.id)
            res.status(200).json(httpSuccessResponse(200, file))
        } catch (err) {
            next(err)
        }
    }

    findAllByUserId = async (req: Request<{ userId: string }>, res: Response, next: NextFunction): Promise<void> => {
        try {
            if (!req.user) throw new AuthorizationError("Usuário não autenticado")
            const files = await this.service.findAllByUserId(req.user, req.params.userId, req.query as FileFilterDTO)
            res.status(200).json(httpSuccessResponse(200, files))
        } catch (err) {
            next(err)
        }
    }

    update = async (req: Request<{ id: string }, any, UpdateFileDTO>, res: Response, next: NextFunction): Promise<void> => {
        try {
            if (!req.user) throw new AuthorizationError("Usuário não autenticado")
            const file = await this.service.update(req.user, req.params.id, req.body)
            res.status(200).json(httpSuccessResponse(200, file))
        } catch (err) {
            next(err)
        }
    }

    delete = async (req: Request<{ id: string }>, res: Response, next: NextFunction): Promise<void> => {
        try {
            if (!req.user) throw new AuthorizationError("Usuário não autenticado")
            await this.service.delete(req.user, req.params.id)
            res.status(204).send()
        } catch (err) {
            next(err)
        }
    }

    createAccess = async (req: Request<{ id: string }>, res: Response, next: NextFunction): Promise<void> => {
        try {
            if (!req.user) throw new AuthorizationError("Usuário não autenticado")
            const access = await this.service.createAccess(req.user, req.params.id)
            res.status(200).json(httpSuccessResponse(200, access))
        } catch (err) {
            next(err)
        }
    }

    /**
     * Rota pública protegida por token temporário (query ?token=), usada por <video>, <img> e downloads.
     */
    content = async (req: Request<{ id: string }>, res: Response, next: NextFunction): Promise<void> => {
        try {
            const token = typeof req.query.token === "string" ? req.query.token : ""
            const file = await this.service.resolveByToken(token)

            if (file.id !== req.params.id) throw new AuthorizationError("Link do arquivo inválido ou expirado")

            await streamFile(req, res, this.storage, file, req.query.download === "1")
        } catch (err) {
            next(err)
        }
    }
}
