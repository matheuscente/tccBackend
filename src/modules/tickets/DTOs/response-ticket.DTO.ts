import type { TicketCategory, TicketStatus } from "@prisma/client"

export interface ResponseTicketDTO {
    id: string
    subject: string
    category: TicketCategory
    status: TicketStatus
    user: { id: string, name: string, username: string }
    messageCount: number
    lastMessageAt: string | null
    lastMessageByAdmin: boolean
    createdAt: string
    updatedAt: string
    closedAt: string | null
}
