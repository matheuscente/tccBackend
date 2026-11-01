import type { Ticket, TicketAttachment, TicketEvent, TicketMessage } from "@prisma/client"

export type TicketWithMessagesDTO = Ticket & {
    user: { id: string, name: string, username: string, email: string }
    assignedTo: { id: string, name: string } | null
    closedBy: { id: string, name: string } | null
    messages: (TicketMessage & {
        author: { id: string, name: string, role: "ADMIN" | "USER" }
        attachments: TicketAttachment[]
    })[]
    events: (TicketEvent & {
        actor: { id: string, name: string }
        target: { id: string, name: string } | null
    })[]
}
