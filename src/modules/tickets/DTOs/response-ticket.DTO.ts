import type { TicketCategory, TicketStatus } from "@prisma/client"
import type { TicketCloserDTO } from "./ticket-closer.DTO"

export interface ResponseTicketDTO {
    id: string
    subject: string
    category: TicketCategory
    status: TicketStatus
    user: { id: string, name: string, username: string }
    assignedTo: { id: string, name: string } | null
    closedBy: TicketCloserDTO | null
    messageCount: number
    lastMessageAt: string | null
    lastMessageByAdmin: boolean
    createdAt: string
    updatedAt: string
    closedAt: string | null
}
