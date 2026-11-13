import type { TicketStatus } from "@prisma/client"

export interface UpdateTicketRepositoryDTO {
    status?: TicketStatus
    assignedToId?: string | null
    closedAt?: Date | null
    closedById?: string | null
}
