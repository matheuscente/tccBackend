import type { ResponseTicketDTO } from "./response-ticket.DTO"
import type { ResponseTicketMessageDTO } from "./response-ticket-message.DTO"

export interface ResponseTicketDetailDTO extends Omit<ResponseTicketDTO, "messageCount" | "lastMessageAt" | "lastMessageByAdmin"> {
    messages: ResponseTicketMessageDTO[]
}
