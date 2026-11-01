import type { TicketEventType, TicketStatus } from "@prisma/client"

export interface ResponseTicketEventDTO {
    id: string
    type: TicketEventType
    status: TicketStatus | null
    actor: { id: string, name: string }
    target: { id: string, name: string } | null
    createdAt: string
}
