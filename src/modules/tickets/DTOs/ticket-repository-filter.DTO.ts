import type { TicketFilterDTO } from "./ticket-filter.DTO"

export interface TicketRepositoryFilterDTO extends TicketFilterDTO {
    userId?: string
    // administrador: esconde os chamados em atendimento por outro administrador
    visibleToAdminId?: string
}
