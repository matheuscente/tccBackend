import type { Ticket, TicketAttachment, TicketMessage, TicketStatus } from "@prisma/client"
import type { AttachmentInputDTO, CreateTicketRepositoryDTO, TicketFilterDTO, TicketWithMessagesDTO, TicketWithSummaryDTO } from "../../DTOs/ticket.DTO"

export interface ITicketRepository {
    create(data: CreateTicketRepositoryDTO): Promise<Ticket>
    findById(ticketId: string): Promise<Ticket | null>
    findByIdWithMessages(ticketId: string): Promise<TicketWithMessagesDTO | null>
    findAll(filter: TicketFilterDTO & { userId?: string }): Promise<TicketWithSummaryDTO[]>
    addMessage(ticketId: string, authorId: string, content: string, attachments: AttachmentInputDTO[]): Promise<TicketMessage>
    updateStatus(ticketId: string, status: TicketStatus): Promise<Ticket>
    findAttachmentById(attachmentId: string): Promise<(TicketAttachment & { message: { ticket: { userId: string } } }) | null>
    countByStatus(): Promise<Record<TicketStatus, number>>
}
