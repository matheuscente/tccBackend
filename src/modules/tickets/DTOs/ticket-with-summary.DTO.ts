import type { Ticket } from "@prisma/client"

export type TicketWithSummaryDTO = Ticket & {
    user: { id: string, name: string, username: string }
    _count: { messages: number }
    messages: { createdAt: Date, author: { role: "ADMIN" | "USER" } }[]
}
