import type { NextFunction, Request, Response } from "express";
import type { TicketStatus } from "@prisma/client";
import { httpSuccessResponse } from "../../../shared/controller/httpSuccessResponse.util";
import { AuthorizationError } from "../../../shared/errors/authorization.error";
import type { IStorageProvider } from "../../../shared/storage/storage-provider.interface";
import { streamFile } from "../../../shared/storage/stream-file.util";
import type { AddTicketMessageDTO, CreateTicketDTO, TicketFilterDTO } from "../DTOs/ticket.DTO";
import type { ITicketService } from "../interfaces/services/ticket-service.interface";

const uploadedImages = (req: Request) => (Array.isArray(req.files) ? req.files : [])

export class TicketController {
    constructor(
        private readonly service: ITicketService,
        private readonly storage: IStorageProvider
    ) { }

    create = async (req: Request<any, any, CreateTicketDTO>, res: Response, next: NextFunction): Promise<void> => {
        try {
            if (!req.user) throw new AuthorizationError("Usuário não autenticado")
            const ticket = await this.service.create(req.user, req.body, uploadedImages(req))
            res.status(201).json(httpSuccessResponse(201, ticket))
        } catch (err) {
            next(err)
        }
    }

    findAll = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            if (!req.user) throw new AuthorizationError("Usuário não autenticado")
            const tickets = await this.service.findAll(req.user, req.query as TicketFilterDTO)
            res.status(200).json(httpSuccessResponse(200, tickets))
        } catch (err) {
            next(err)
        }
    }

    findById = async (req: Request<{ id: string }>, res: Response, next: NextFunction): Promise<void> => {
        try {
            if (!req.user) throw new AuthorizationError("Usuário não autenticado")
            const ticket = await this.service.findById(req.user, req.params.id)
            res.status(200).json(httpSuccessResponse(200, ticket))
        } catch (err) {
            next(err)
        }
    }

    addMessage = async (req: Request<{ id: string }, any, AddTicketMessageDTO>, res: Response, next: NextFunction): Promise<void> => {
        try {
            if (!req.user) throw new AuthorizationError("Usuário não autenticado")
            const ticket = await this.service.addMessage(req.user, req.params.id, req.body, uploadedImages(req))
            res.status(201).json(httpSuccessResponse(201, ticket))
        } catch (err) {
            next(err)
        }
    }

    updateStatus = async (req: Request<{ id: string }, any, { status: TicketStatus }>, res: Response, next: NextFunction): Promise<void> => {
        try {
            if (!req.user) throw new AuthorizationError("Usuário não autenticado")
            const ticket = await this.service.updateStatus(req.user, req.params.id, req.body.status)
            res.status(200).json(httpSuccessResponse(200, ticket))
        } catch (err) {
            next(err)
        }
    }

    attachmentContent = async (req: Request<{ id: string }>, res: Response, next: NextFunction): Promise<void> => {
        try {
            const token = typeof req.query.token === "string" ? req.query.token : ""
            const attachment = await this.service.resolveAttachmentByToken(req.params.id, token)
            await streamFile(req, res, this.storage, attachment, req.query.download === "1")
        } catch (err) {
            next(err)
        }
    }
}
