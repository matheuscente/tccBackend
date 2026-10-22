import type { TicketAttachment, TicketStatus } from "@prisma/client"
import type { AuthUserDTO } from "../../../../shared/DTOs/auth-user.DTO"
import type { UploadedFileDTO } from "../../../files/DTOs/uploaded-file.DTO"
import type { CreateTicketDTO } from "../../DTOs/create-ticket.DTO"
import type { AddTicketMessageDTO } from "../../DTOs/add-ticket-message.DTO"
import type { TicketFilterDTO } from "../../DTOs/ticket-filter.DTO"
import type { ResponseTicketDTO } from "../../DTOs/response-ticket.DTO"
import type { ResponseTicketDetailDTO } from "../../DTOs/response-ticket-detail.DTO"

export interface ITicketService {
    create(authUser: AuthUserDTO, data: CreateTicketDTO, images: UploadedFileDTO[]): Promise<ResponseTicketDetailDTO>
    findAll(authUser: AuthUserDTO, filter: TicketFilterDTO): Promise<ResponseTicketDTO[]>
    findById(authUser: AuthUserDTO, ticketId: string): Promise<ResponseTicketDetailDTO>
    addMessage(authUser: AuthUserDTO, ticketId: string, data: AddTicketMessageDTO, images: UploadedFileDTO[]): Promise<ResponseTicketDetailDTO>
    updateStatus(authUser: AuthUserDTO, ticketId: string, status: TicketStatus): Promise<ResponseTicketDetailDTO>
    resolveAttachmentByToken(attachmentId: string, token: string): Promise<TicketAttachment>
}
