import type { TicketAttachment, TicketStatus } from "@prisma/client"
import type { AuthUserDTO } from "../../../../shared/DTOs/auth-user.DTO"
import type { AddTicketMessageDTO, CreateTicketDTO, ResponseTicketDTO, ResponseTicketDetailDTO, TicketFilterDTO, UploadedImageDTO } from "../../DTOs/ticket.DTO"

export interface ITicketService {
    create(authUser: AuthUserDTO, data: CreateTicketDTO, images: UploadedImageDTO[]): Promise<ResponseTicketDetailDTO>
    findAll(authUser: AuthUserDTO, filter: TicketFilterDTO): Promise<ResponseTicketDTO[]>
    findById(authUser: AuthUserDTO, ticketId: string): Promise<ResponseTicketDetailDTO>
    addMessage(authUser: AuthUserDTO, ticketId: string, data: AddTicketMessageDTO, images: UploadedImageDTO[]): Promise<ResponseTicketDetailDTO>
    updateStatus(authUser: AuthUserDTO, ticketId: string, status: TicketStatus): Promise<ResponseTicketDetailDTO>
    resolveAttachmentByToken(attachmentId: string, token: string): Promise<TicketAttachment>
}
