import type { NextFunction, Request, Response } from "express"
import type { CreateTicketDTO } from "../../DTOs/create-ticket.DTO"
import type { AddTicketMessageDTO } from "../../DTOs/add-ticket-message.DTO"
import type { UpdateTicketStatusDTO } from "../../DTOs/update-ticket-status.DTO"
import type { TicketFilterDTO } from "../../DTOs/ticket-filter.DTO"

export interface ITicketController {
    create(req: Request<any, any, CreateTicketDTO>, res: Response, next: NextFunction): Promise<void>

    findAll(req: Request<any, any, any, TicketFilterDTO>, res: Response, next: NextFunction): Promise<void>

    findById(req: Request<{ id: string }>, res: Response, next: NextFunction): Promise<void>

    addMessage(req: Request<{ id: string }, any, AddTicketMessageDTO>, res: Response, next: NextFunction): Promise<void>

    updateStatus(req: Request<{ id: string }, any, UpdateTicketStatusDTO>, res: Response, next: NextFunction): Promise<void>

    attachmentContent(req: Request<{ id: string }>, res: Response, next: NextFunction): Promise<void>
}
