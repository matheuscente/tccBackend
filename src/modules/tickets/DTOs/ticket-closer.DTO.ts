export interface TicketCloserDTO {
    id: string
    name: string
    // true quando quem encerrou foi o suporte (um administrador que não é o dono do chamado)
    bySupport: boolean
}
