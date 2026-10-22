import type { AttachmentInputDTO } from "./attachment-input.DTO"

export interface CreateTicketMessageRepositoryDTO {
    authorId: string
    content: string
    attachments: AttachmentInputDTO[]
}
