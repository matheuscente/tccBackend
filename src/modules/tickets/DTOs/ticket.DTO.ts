import type { Ticket, TicketAttachment, TicketCategory, TicketMessage, TicketStatus } from "@prisma/client"
import type { UploadedFileDTO } from "../../files/DTOs/file.DTO"

export interface CreateTicketDTO {
    subject: string
    category: TicketCategory
    message: string
}

export interface AddTicketMessageDTO {
    message: string
}

export interface TicketFilterDTO {
    status?: TicketStatus
    search?: string
}

export interface AttachmentInputDTO {
    originalName: string
    mimeType: string
    size: number
    storageKey: string
}

export interface CreateTicketRepositoryDTO {
    userId: string
    subject: string
    category: TicketCategory
    message: { authorId: string, content: string, attachments: AttachmentInputDTO[] }
}

export type TicketWithSummaryDTO = Ticket & {
    user: { id: string, name: string, username: string }
    _count: { messages: number }
    messages: { createdAt: Date, author: { role: "ADMIN" | "USER" } }[]
}

export type TicketWithMessagesDTO = Ticket & {
    user: { id: string, name: string, username: string, email: string }
    messages: (TicketMessage & {
        author: { id: string, name: string, role: "ADMIN" | "USER" }
        attachments: TicketAttachment[]
    })[]
}

export interface ResponseTicketDTO {
    id: string
    subject: string
    category: TicketCategory
    status: TicketStatus
    user: { id: string, name: string, username: string }
    messageCount: number
    lastMessageAt: string | null
    lastMessageByAdmin: boolean
    createdAt: string
    updatedAt: string
    closedAt: string | null
}

export interface ResponseTicketDetailDTO extends Omit<ResponseTicketDTO, "messageCount" | "lastMessageAt" | "lastMessageByAdmin"> {
    messages: {
        id: string
        content: string
        createdAt: string
        author: { id: string, name: string, role: "ADMIN" | "USER" }
        attachments: { id: string, originalName: string, mimeType: string, size: number, url: string }[]
    }[]
}

export type UploadedImageDTO = UploadedFileDTO
