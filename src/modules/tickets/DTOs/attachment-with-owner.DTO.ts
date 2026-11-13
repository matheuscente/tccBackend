import type { TicketAttachment } from "@prisma/client"

export interface AttachmentWithOwnerDTO extends TicketAttachment {
    message: { ticket: { userId: string } }
}
