import type { TicketFilterDTO } from "./ticket-filter.DTO"

export interface TicketRepositoryFilterDTO extends TicketFilterDTO {
    userId?: string
}
