import type { TicketCategory } from "@prisma/client"
import type { CreateTicketMessageRepositoryDTO } from "./create-ticket-message-repository.DTO"

export interface CreateTicketRepositoryDTO {
    userId: string
    subject: string
    category: TicketCategory
    message: CreateTicketMessageRepositoryDTO
}
