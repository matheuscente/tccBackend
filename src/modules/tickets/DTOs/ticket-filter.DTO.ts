import type { TicketStatus } from "@prisma/client"

export interface TicketFilterDTO {
    status?: TicketStatus
    search?: string
}
