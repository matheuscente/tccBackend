import type { Ticket, TicketEvent, TicketMessage, TicketStatus } from "@prisma/client"
import type { AttachmentInputDTO } from "../../DTOs/attachment-input.DTO"
import type { AttachmentWithOwnerDTO } from "../../DTOs/attachment-with-owner.DTO"
import type { CreateTicketRepositoryDTO } from "../../DTOs/create-ticket-repository.DTO"
import type { CreateTicketEventRepositoryDTO } from "../../DTOs/create-ticket-event-repository.DTO"
import type { UpdateTicketRepositoryDTO } from "../../DTOs/update-ticket-repository.DTO"
import type { TicketRepositoryFilterDTO } from "../../DTOs/ticket-repository-filter.DTO"
import type { TicketWithMessagesDTO } from "../../DTOs/ticket-with-messages.DTO"
import type { TicketWithSummaryDTO } from "../../DTOs/ticket-with-summary.DTO"

export interface ITicketRepository {
    create(data: CreateTicketRepositoryDTO): Promise<Ticket>
    findById(ticketId: string): Promise<Ticket | null>
    findByIdWithMessages(ticketId: string): Promise<TicketWithMessagesDTO | null>
    findAll(filter: TicketRepositoryFilterDTO): Promise<TicketWithSummaryDTO[]>
    addMessage(ticketId: string, authorId: string, content: string, attachments: AttachmentInputDTO[]): Promise<TicketMessage>
    update(ticketId: string, data: UpdateTicketRepositoryDTO): Promise<Ticket>
    addEvent(data: CreateTicketEventRepositoryDTO): Promise<TicketEvent>
    findAttachmentById(attachmentId: string): Promise<AttachmentWithOwnerDTO | null>
    countByStatus(): Promise<Record<TicketStatus, number>>
}
