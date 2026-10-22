import type { TicketCategory } from "@prisma/client"

export interface CreateTicketDTO {
    subject: string
    category: TicketCategory
    message: string
}
