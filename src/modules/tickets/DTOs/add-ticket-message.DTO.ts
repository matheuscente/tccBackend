export interface AddTicketMessageDTO {
    message: string
    // resposta do administrador responsável: mantém o chamado em atendimento em vez de marcar como respondido
    keepInProgress?: boolean
}
