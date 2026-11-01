import type { TicketEventType, TicketStatus } from "@prisma/client"

export interface CreateTicketEventRepositoryDTO {
    ticketId: string
    actorId: string
    type: TicketEventType
    status?: TicketStatus | null
    targetId?: string | null
}
