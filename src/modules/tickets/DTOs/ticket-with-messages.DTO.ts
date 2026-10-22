import type { Ticket, TicketAttachment, TicketMessage } from "@prisma/client"

export type TicketWithMessagesDTO = Ticket & {
    user: { id: string, name: string, username: string, email: string }
    messages: (TicketMessage & {
        author: { id: string, name: string, role: "ADMIN" | "USER" }
        attachments: TicketAttachment[]
    })[]
}
