import { randomUUID } from "crypto";
import path from "path";
import type { Ticket, TicketAttachment, TicketStatus } from "@prisma/client";
import type { AuthUserDTO } from "../../../shared/DTOs/auth-user.DTO";
import { ForbiddenError } from "../../../shared/errors/forbidden.error";
import { NotFoundError } from "../../../shared/errors/not-found-error";
import { ValidationError } from "../../../shared/errors/validation-error";
import type { IFileTokenService } from "../../../shared/file-token/interfaces/file-token-service.interface";
import type { IStorageProvider } from "../../../shared/storage/interfaces/storage-provider.interface";
import type { ITransaction } from "../../transaction/interfaces/transaction.interface";
import type { UploadedFileDTO } from "../../files/DTOs/uploaded-file.DTO";
import type { AddTicketMessageDTO } from "../DTOs/add-ticket-message.DTO";
import type { AttachmentInputDTO } from "../DTOs/attachment-input.DTO";
import type { CreateTicketDTO } from "../DTOs/create-ticket.DTO";
import type { ResponseTicketDTO } from "../DTOs/response-ticket.DTO";
import type { ResponseTicketDetailDTO } from "../DTOs/response-ticket-detail.DTO";
import type { TicketFilterDTO } from "../DTOs/ticket-filter.DTO";
import type { TicketWithMessagesDTO } from "../DTOs/ticket-with-messages.DTO";
import type { TicketWithSummaryDTO } from "../DTOs/ticket-with-summary.DTO";
import type { ITicketRepository } from "../interfaces/repositories/ticket-repository.interface";
import type { IUserRepository } from "../../users/interfaces/user-repository.interface";
import type { TransferTicketDTO } from "../DTOs/transfer-ticket.DTO";
import type { UpdateTicketRepositoryDTO } from "../DTOs/update-ticket-repository.DTO";
import type { ITicketService } from "../interfaces/services/ticket-service.interface";

const MAX_IMAGES = 5

// diferente de notas e arquivos, as imagens do chamado são visíveis ao administrador (foram enviadas ao suporte)
export class TicketService implements ITicketService {
    constructor(
        private readonly ticketRepository: ITicketRepository,
        private readonly storage: IStorageProvider,
        private readonly fileTokenService: IFileTokenService,
        private readonly publicApiUrl: string,
        private readonly transaction: ITransaction,
        private readonly userRepository: IUserRepository
    ) { }

    async create(authUser: AuthUserDTO, data: CreateTicketDTO, images: UploadedFileDTO[]): Promise<ResponseTicketDetailDTO> {
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
        const tickets = await this.ticketRepository.findAll({
            ...filter,
            ...(authUser.role === "ADMIN" ? { visibleToAdminId: authUser.id } : { userId: authUser.id })
        })

        return tickets.map(ticket => this.mapSummary(ticket))
    }

    async findById(authUser: AuthUserDTO, ticketId: string): Promise<ResponseTicketDetailDTO> {
        const ticket = await this.ticketRepository.findById(ticketId)
        if (!ticket) throw new NotFoundError("Chamado não encontrado")

        this.checkAccess(authUser, ticket)

        return this.getDetail(ticketId)
    }

    async addMessage(authUser: AuthUserDTO, ticketId: string, data: AddTicketMessageDTO, images: UploadedFileDTO[]): Promise<ResponseTicketDetailDTO> {
        const ticket = await this.ticketRepository.findById(ticketId)
        if (!ticket) throw new NotFoundError("Chamado não encontrado")

        this.checkAccess(authUser, ticket)

        if (ticket.status === "CLOSED") throw new ValidationError("Este chamado está encerrado")

        // suporte: responde (ANSWERED, libera o chamado) ou continua em atendimento;
        // usuário: volta para OPEN, a não ser que o chamado esteja em atendimento (continua com o mesmo administrador)
        const inProgress = ticket.status === "IN_PROGRESS"
        const nextStatus: TicketStatus = this.isSupport(authUser, ticket)
            ? (inProgress && data.keepInProgress ? "IN_PROGRESS" : "ANSWERED")
            : (inProgress ? "IN_PROGRESS" : "OPEN")
        const changes: UpdateTicketRepositoryDTO = nextStatus === "IN_PROGRESS" ? {} : { status: nextStatus, assignedToId: null }

        const attachments = await this.storeImages(ticket.userId, images)

        try {
            await this.transaction.execute(async (repositories) => {
                await repositories.ticketRepository.addMessage(ticket.id, authUser.id, data.message.trim(), attachments)

                if (ticket.status !== nextStatus) await repositories.ticketRepository.update(ticket.id, changes)
            })
        } catch (err) {
            await this.removeImages(attachments)
            throw err
        }

        return this.getDetail(ticket.id)
    }

    async updateStatus(authUser: AuthUserDTO, ticketId: string, status: TicketStatus): Promise<ResponseTicketDetailDTO> {
        const ticket = await this.ticketRepository.findById(ticketId)
        if (!ticket) throw new NotFoundError("Chamado não encontrado")

        this.checkAccess(authUser, ticket)

        if (!this.isSupport(authUser, ticket)) {
            if (status !== "CLOSED") throw new ForbiddenError("Você pode apenas encerrar o chamado")
            if (ticket.status === "CLOSED") throw new ValidationError("Este chamado já está encerrado")
        }

        if (ticket.status === status) return this.getDetail(ticket.id)

        // IN_PROGRESS = o administrador recebe o chamado; qualquer outro status libera o chamado para todos
        const closing = status === "CLOSED"
        const changes: UpdateTicketRepositoryDTO = {
            status,
            assignedToId: status === "IN_PROGRESS" ? authUser.id : null,
            closedAt: closing ? new Date() : null,
            closedById: closing ? authUser.id : null
        }

        await this.transaction.execute(async (repositories) => {
            await repositories.ticketRepository.update(ticket.id, changes)
            await repositories.ticketRepository.addEvent({
                ticketId: ticket.id,
                actorId: authUser.id,
                type: status === "IN_PROGRESS" ? "ASSIGNED" : "STATUS_CHANGED",
                status
            })
        })

        return this.getDetail(ticket.id)
    }

    async transfer(authUser: AuthUserDTO, ticketId: string, data: TransferTicketDTO): Promise<ResponseTicketDetailDTO> {
        const ticket = await this.ticketRepository.findById(ticketId)
        if (!ticket) throw new NotFoundError("Chamado não encontrado")

        this.checkAccess(authUser, ticket)

        if (!this.isSupport(authUser, ticket) || ticket.status !== "IN_PROGRESS" || ticket.assignedToId !== authUser.id) {
            throw new ForbiddenError("Só o administrador que está atendendo o chamado pode transferi-lo")
        }
        if (data.adminId === authUser.id) throw new ValidationError("Escolha outro administrador para transferir")

        const target = await this.userRepository.findById(data.adminId)
        if (!target || target.role !== "ADMIN" || target.deletedAt) throw new ValidationError("Administrador não encontrado")
        if (target.id === ticket.userId) throw new ValidationError("O chamado não pode ser transferido para quem o abriu")

        await this.transaction.execute(async (repositories) => {
            await repositories.ticketRepository.update(ticket.id, { assignedToId: target.id })
            await repositories.ticketRepository.addEvent({ ticketId: ticket.id, actorId: authUser.id, type: "TRANSFERRED", targetId: target.id })
        })

        return this.getDetail(ticket.id)
    }

    async resolveAttachmentByToken(attachmentId: string, token: string): Promise<TicketAttachment> {
        const payload = this.fileTokenService.verify(token, "attachment")
        if (payload.sub !== attachmentId) throw new ForbiddenError("Link do arquivo inválido")

        const attachment = await this.ticketRepository.findAttachmentById(attachmentId)
        if (!attachment) throw new NotFoundError("Anexo não encontrado")

        return attachment
    }

    private isSupport(authUser: AuthUserDTO, ticket: Ticket) {
        return authUser.role === "ADMIN" && authUser.id !== ticket.userId
    }

    // o dono sempre vê o chamado; um chamado em atendimento fica visível só para o administrador responsável
    private checkAccess(authUser: AuthUserDTO, ticket: Ticket) {
        if (authUser.id === ticket.userId) return
        if (authUser.role !== "ADMIN") throw new ForbiddenError("Ação não autorizada")
        if (ticket.status === "IN_PROGRESS" && ticket.assignedToId !== authUser.id) {
            throw new ForbiddenError("Este chamado está em atendimento por outro administrador")
        }
    }

    private mapCloser(ticket: { userId: string, closedBy: { id: string, name: string } | null }) {
        return ticket.closedBy ? { ...ticket.closedBy, bySupport: ticket.closedBy.id !== ticket.userId } : null
    }

    private async storeImages(ownerId: string, images: UploadedFileDTO[]): Promise<AttachmentInputDTO[]> {
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
            assignedTo: ticket.assignedTo,
            closedBy: this.mapCloser(ticket),
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
            assignedTo: ticket.assignedTo,
            closedBy: this.mapCloser(ticket),
            createdAt: ticket.createdAt.toISOString(),
            updatedAt: ticket.updatedAt.toISOString(),
            closedAt: ticket.closedAt ? ticket.closedAt.toISOString() : null,
            events: ticket.events.map(event => ({
                id: event.id,
                type: event.type,
                status: event.status,
                actor: event.actor,
                target: event.target,
                createdAt: event.createdAt.toISOString()
            })),
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
