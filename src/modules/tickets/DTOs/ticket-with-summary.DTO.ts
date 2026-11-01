import type { Ticket } from "@prisma/client"

export type TicketWithSummaryDTO = Ticket & {
    user: { id: string, name: string, username: string }
    assignedTo: { id: string, name: string } | null
    closedBy: { id: string, name: string } | null
    _count: { messages: number }
    messages: { createdAt: Date, author: { role: "ADMIN" | "USER" } }[]
}
