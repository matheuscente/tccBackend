import { randomUUID } from "crypto";
import path from "path";
import type { TicketAttachment, TicketStatus } from "@prisma/client";
import type { AuthUserDTO } from "../../../shared/DTOs/auth-user.DTO";
import { ForbiddenError } from "../../../shared/errors/forbidden.error";
import { NotFoundError } from "../../../shared/errors/not-found-error";
import { ValidationError } from "../../../shared/errors/validation-error";
import type { IFileTokenService } from "../../../shared/file-token/file-token.service";
import type { IStorageProvider } from "../../../shared/storage/storage-provider.interface";
import type { AddTicketMessageDTO, AttachmentInputDTO, CreateTicketDTO, ResponseTicketDTO, ResponseTicketDetailDTO, TicketFilterDTO, TicketWithMessagesDTO, TicketWithSummaryDTO, UploadedImageDTO } from "../DTOs/ticket.DTO";
import type { ITicketRepository } from "../interfaces/repositories/ticket-repository.interface";
import type { ITicketService } from "../interfaces/services/ticket-service.interface";

const MAX_IMAGES = 5

/**
 * SAC: o usuário abre chamados com mensagens e imagens; o administrador responde pelo painel.
 * As imagens anexadas ao chamado são visíveis ao administrador (foram enviadas ao suporte).
 */
export class TicketService implements ITicketService {
    constructor(
        private readonly ticketRepository: ITicketRepository,
        private readonly storage: IStorageProvider,
        private readonly fileTokenService: IFileTokenService,
        private readonly publicApiUrl: string
    ) { }

    async create(authUser: AuthUserDTO, data: CreateTicketDTO, images: UploadedImageDTO[]): Promise<ResponseTicketDetailDTO> {
        const attachments = await this.storeImages(authUser.id, images)

        try {
            const ticket = await this.ticketRepository.create({
                userId: authUser.id,
                subject: data.subject.trim(),
                category: data.category,
                message: { authorId: authUser.id, content: data.message.trim(), attachments }
            })

            return this.getDetail(ticket.id)
        } catch (err) {
            await this.removeImages(attachments)
            throw err
        }
    }

    async findAll(authUser: AuthUserDTO, filter: TicketFilterDTO): Promise<ResponseTicketDTO[]> {
        // usuário comum vê apenas os próprios chamados; o administrador vê todos
        const tickets = await this.ticketRepository.findAll({
            ...filter,
            ...(authUser.role === "ADMIN" ? {} : { userId: authUser.id })
        })

        return tickets.map(ticket => this.mapSummary(ticket))
    }

    async findById(authUser: AuthUserDTO, ticketId: string): Promise<ResponseTicketDetailDTO> {
        const ticket = await this.ticketRepository.findById(ticketId)
        if (!ticket) throw new NotFoundError("Chamado não encontrado")

        this.checkAccess(authUser, ticket.userId)

        return this.getDetail(ticketId)
    }

    async addMessage(authUser: AuthUserDTO, ticketId: string, data: AddTicketMessageDTO, images: UploadedImageDTO[]): Promise<ResponseTicketDetailDTO> {
        const ticket = await this.ticketRepository.findById(ticketId)
        if (!ticket) throw new NotFoundError("Chamado não encontrado")

        this.checkAccess(authUser, ticket.userId)

        if (ticket.status === "CLOSED") throw new ValidationError("Este chamado está encerrado")

        const attachments = await this.storeImages(ticket.userId, images)

        try {
            await this.ticketRepository.addMessage(ticket.id, authUser.id, data.message.trim(), attachments)
        } catch (err) {
            await this.removeImages(attachments)
            throw err
        }

        // resposta do suporte => ANSWERED; nova mensagem do usuário => volta para OPEN
        const isSupport = authUser.role === "ADMIN" && authUser.id !== ticket.userId
        const nextStatus: TicketStatus = isSupport ? "ANSWERED" : "OPEN"

        if (ticket.status !== nextStatus) await this.ticketRepository.updateStatus(ticket.id, nextStatus)

        return this.getDetail(ticket.id)
    }

    async updateStatus(authUser: AuthUserDTO, ticketId: string, status: TicketStatus): Promise<ResponseTicketDetailDTO> {
        const ticket = await this.ticketRepository.findById(ticketId)
        if (!ticket) throw new NotFoundError("Chamado não encontrado")

        this.checkAccess(authUser, ticket.userId)

        // o usuário pode apenas encerrar o próprio chamado; o administrador pode qualquer status
        if (authUser.role !== "ADMIN" && status !== "CLOSED") {
            throw new ForbiddenError("Você pode apenas encerrar o chamado")
        }

        if (ticket.status !== status) await this.ticketRepository.updateStatus(ticket.id, status)

        return this.getDetail(ticket.id)
    }

    async resolveAttachmentByToken(attachmentId: string, token: string): Promise<TicketAttachment> {
        const payload = this.fileTokenService.verify(token, "attachment")
        if (payload.sub !== attachmentId) throw new ForbiddenError("Link do arquivo inválido")

        const attachment = await this.ticketRepository.findAttachmentById(attachmentId)
        if (!attachment) throw new NotFoundError("Anexo não encontrado")

        return attachment
    }

    private checkAccess(authUser: AuthUserDTO, ownerId: string) {
        if (authUser.role !== "ADMIN" && authUser.id !== ownerId) throw new ForbiddenError("Ação não autorizada")
    }

    private async storeImages(ownerId: string, images: UploadedImageDTO[]): Promise<AttachmentInputDTO[]> {
        if (images.length > MAX_IMAGES) throw new ValidationError(`Envie no máximo ${MAX_IMAGES} imagens`)

        const stored: AttachmentInputDTO[] = []

        try {
            for (const image of images) {
                const extension = path.extname(image.originalname).toLowerCase().replace(/[^.a-z0-9]/g, "")
                const storageKey = `tickets/${ownerId}/${randomUUID()}${extension}`

                await this.storage.put(storageKey, image.buffer, image.mimetype)

                stored.push({
                    originalName: image.originalname.slice(0, 200),
                    mimeType: image.mimetype,
                    size: image.size,
                    storageKey
                })
            }
        } catch (err) {
            await this.removeImages(stored)
            throw err
        }

        return stored
    }

    private async removeImages(attachments: AttachmentInputDTO[]) {
        await Promise.all(attachments.map(item => this.storage.delete(item.storageKey).catch(() => undefined)))
    }

    private async getDetail(ticketId: string): Promise<ResponseTicketDetailDTO> {
        const ticket = await this.ticketRepository.findByIdWithMessages(ticketId)
        if (!ticket) throw new NotFoundError("Chamado não encontrado")
        return this.mapDetail(ticket)
    }

    private mapSummary(ticket: TicketWithSummaryDTO): ResponseTicketDTO {
        const last = ticket.messages[0]

        return {
            id: ticket.id,
            subject: ticket.subject,
            category: ticket.category,
            status: ticket.status,
            user: ticket.user,
            messageCount: ticket._count.messages,
            lastMessageAt: last ? last.createdAt.toISOString() : null,
            lastMessageByAdmin: last ? last.author.role === "ADMIN" : false,
            createdAt: ticket.createdAt.toISOString(),
            updatedAt: ticket.updatedAt.toISOString(),
            closedAt: ticket.closedAt ? ticket.closedAt.toISOString() : null
        }
    }

    private mapDetail(ticket: TicketWithMessagesDTO): ResponseTicketDetailDTO {
        return {
            id: ticket.id,
            subject: ticket.subject,
            category: ticket.category,
            status: ticket.status,
            user: { id: ticket.user.id, name: ticket.user.name, username: ticket.user.username },
            createdAt: ticket.createdAt.toISOString(),
            updatedAt: ticket.updatedAt.toISOString(),
            closedAt: ticket.closedAt ? ticket.closedAt.toISOString() : null,
            messages: ticket.messages.map(message => ({
                id: message.id,
                content: message.content,
                createdAt: message.createdAt.toISOString(),
                author: message.author,
                attachments: message.attachments.map(attachment => ({
                    id: attachment.id,
                    originalName: attachment.originalName,
                    mimeType: attachment.mimeType,
                    size: attachment.size,
                    url: `${this.publicApiUrl}/tickets/attachments/${attachment.id}/content?token=${encodeURIComponent(this.fileTokenService.sign({ sub: attachment.id, kind: "attachment" }))}`
                }))
            }))
        }
    }
}
