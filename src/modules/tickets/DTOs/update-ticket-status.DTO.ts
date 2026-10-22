import type { TicketStatus } from "@prisma/client"

export interface UpdateTicketStatusDTO {
    status: TicketStatus
}
