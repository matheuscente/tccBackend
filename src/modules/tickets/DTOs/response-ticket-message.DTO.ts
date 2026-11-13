export interface ResponseTicketMessageDTO {
    id: string
    content: string
    createdAt: string
    author: { id: string, name: string, role: "ADMIN" | "USER" }
    attachments: { id: string, originalName: string, mimeType: string, size: number, url: string }[]
}
