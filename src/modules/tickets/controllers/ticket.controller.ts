import type { NextFunction, Request, Response } from "express";
import { httpSuccessResponse } from "../../../shared/controller/httpSuccessResponse.util";
import { AuthorizationError } from "../../../shared/errors/authorization.error";
import type { IStorageProvider } from "../../../shared/storage/interfaces/storage-provider.interface";
import { streamFile } from "../../../shared/storage/utils/stream-file.util";
import type { UploadedFileDTO } from "../../files/DTOs/uploaded-file.DTO";
import type { CreateTicketDTO } from "../DTOs/create-ticket.DTO";
import type { AddTicketMessageDTO } from "../DTOs/add-ticket-message.DTO";
import type { UpdateTicketStatusDTO } from "../DTOs/update-ticket-status.DTO";
import type { TicketFilterDTO } from "../DTOs/ticket-filter.DTO";
import type { ITicketController } from "../interfaces/controllers/ticket-controller.interface";
import type { ITicketService } from "../interfaces/services/ticket-service.interface";

export class TicketController implements ITicketController {

    constructor(
        private readonly service: ITicketService,
        private readonly storage: IStorageProvider
    ) { }

    create = async (req: Request<any, any, CreateTicketDTO>, res: Response, next: NextFunction): Promise<void> => {
        try {
            const authUser = req.user
            const data = req.body
            const images = this.uploadedImages(req)

            if (!authUser) throw new AuthorizationError("Usuário não autenticado")

            const ticket = await this.service.create(authUser, data, images)

            res.status(201).json(httpSuccessResponse(201, ticket))

        } catch (err) {
            next(err)
        }
    }

    findAll = async (req: Request<any, any, any, TicketFilterDTO>, res: Response, next: NextFunction): Promise<void> => {
        try {
            const authUser = req.user
            const filter = req.query

            if (!authUser) throw new AuthorizationError("Usuário não autenticado")

            const tickets = await this.service.findAll(authUser, filter)

            res.status(200).json(httpSuccessResponse(200, tickets))

        } catch (err) {
            next(err)
        }
    }

    findById = async (req: Request<{ id: string }>, res: Response, next: NextFunction): Promise<void> => {
        try {
            const authUser = req.user
            const { id } = req.params

            if (!authUser) throw new AuthorizationError("Usuário não autenticado")

            const ticket = await this.service.findById(authUser, id)

            res.status(200).json(httpSuccessResponse(200, ticket))

        } catch (err) {
            next(err)
        }
    }

    addMessage = async (req: Request<{ id: string }, any, AddTicketMessageDTO>, res: Response, next: NextFunction): Promise<void> => {
        try {
            const authUser = req.user
            const { id } = req.params
            const data = req.body
            const images = this.uploadedImages(req)

            if (!authUser) throw new AuthorizationError("Usuário não autenticado")

            const ticket = await this.service.addMessage(authUser, id, data, images)

            res.status(201).json(httpSuccessResponse(201, ticket))

        } catch (err) {
            next(err)
        }
    }

    updateStatus = async (req: Request<{ id: string }, any, UpdateTicketStatusDTO>, res: Response, next: NextFunction): Promise<void> => {
        try {
            const authUser = req.user
            const { id } = req.params
            const { status } = req.body

            if (!authUser) throw new AuthorizationError("Usuário não autenticado")

            const ticket = await this.service.updateStatus(authUser, id, status)

            res.status(200).json(httpSuccessResponse(200, ticket))

        } catch (err) {
            next(err)
        }
    }

    // rota pública: o acesso é validado pelo token temporário de cada anexo
    attachmentContent = async (req: Request<{ id: string }>, res: Response, next: NextFunction): Promise<void> => {
        try {
            const { id } = req.params
            const token = typeof req.query.token === "string" ? req.query.token : ""
            const download = req.query.download === "1"

            const attachment = await this.service.resolveAttachmentByToken(id, token)

            await streamFile(req, res, this.storage, attachment, download)

        } catch (err) {
            next(err)
        }
    }

    private uploadedImages = (req: Request<any, any, any, any>): UploadedFileDTO[] => Array.isArray(req.files) ? req.files : []
}
