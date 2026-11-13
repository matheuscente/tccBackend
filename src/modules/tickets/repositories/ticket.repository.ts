import type { Prisma, PrismaClient, Ticket, TicketEvent, TicketMessage, TicketStatus } from "@prisma/client";
import type { AttachmentInputDTO } from "../DTOs/attachment-input.DTO";
import type { AttachmentWithOwnerDTO } from "../DTOs/attachment-with-owner.DTO";
import type { CreateTicketRepositoryDTO } from "../DTOs/create-ticket-repository.DTO";
import type { CreateTicketEventRepositoryDTO } from "../DTOs/create-ticket-event-repository.DTO";
import type { UpdateTicketRepositoryDTO } from "../DTOs/update-ticket-repository.DTO";
import type { TicketRepositoryFilterDTO } from "../DTOs/ticket-repository-filter.DTO";
import type { TicketWithMessagesDTO } from "../DTOs/ticket-with-messages.DTO";
import type { TicketWithSummaryDTO } from "../DTOs/ticket-with-summary.DTO";
import type { ITicketRepository } from "../interfaces/repositories/ticket-repository.interface";

export class TicketRepository implements ITicketRepository {
    constructor(private readonly orm: PrismaClient | Prisma.TransactionClient) { }

    create(data: CreateTicketRepositoryDTO): Promise<Ticket> {
        return this.orm.ticket.create({
            data: {
                userId: data.userId,
                subject: data.subject,
                category: data.category,
                messages: {
                    create: {
                        authorId: data.message.authorId,
                        content: data.message.content,
                        attachments: { create: data.message.attachments }
                    }
                }
            }
        })
    }

    findById(ticketId: string): Promise<Ticket | null> {
        return this.orm.ticket.findUnique({ where: { id: ticketId } })
    }

    findByIdWithMessages(ticketId: string): Promise<TicketWithMessagesDTO | null> {
        return this.orm.ticket.findUnique({
            where: { id: ticketId },
            include: {
                user: { select: { id: true, name: true, username: true, email: true } },
                assignedTo: { select: { id: true, name: true } },
                closedBy: { select: { id: true, name: true } },
                events: {
                    orderBy: { createdAt: "asc" },
                    include: {
                        actor: { select: { id: true, name: true } },
                        target: { select: { id: true, name: true } }
                    }
                },
                messages: {
                    orderBy: { createdAt: "asc" },
                    include: {
                        author: { select: { id: true, name: true, role: true } },
                        attachments: true
                    }
                }
            }
        })
    }

    findAll(filter: TicketRepositoryFilterDTO): Promise<TicketWithSummaryDTO[]> {
        return this.orm.ticket.findMany({
            where: {
                ...(filter.userId ? { userId: filter.userId } : {}),
                ...(filter.status ? { status: filter.status } : {}),
                AND: [
                    ...(filter.search ? [{
                        OR: [
                            { subject: { contains: filter.search, mode: "insensitive" as const } },
                            { user: { name: { contains: filter.search, mode: "insensitive" as const } } },
                            { user: { username: { contains: filter.search, mode: "insensitive" as const } } }
                        ]
                    }] : []),
                    ...(filter.visibleToAdminId ? [{
                        OR: [
                            { status: { not: "IN_PROGRESS" as const } },
                            { assignedToId: filter.visibleToAdminId },
                            { userId: filter.visibleToAdminId }
                        ]
                    }] : [])
                ]
            },
            include: {
                user: { select: { id: true, name: true, username: true } },
                assignedTo: { select: { id: true, name: true } },
                closedBy: { select: { id: true, name: true } },
                _count: { select: { messages: true } },
                messages: {
                    orderBy: { createdAt: "desc" },
                    take: 1,
                    select: { createdAt: true, author: { select: { role: true } } }
                }
            },
            orderBy: { updatedAt: "desc" }
        })
    }

    async addMessage(ticketId: string, authorId: string, content: string, attachments: AttachmentInputDTO[]): Promise<TicketMessage> {
        const message = await this.orm.ticketMessage.create({
            data: {
                ticketId,
                authorId,
                content,
                attachments: { create: attachments }
            }
        })

        // a listagem é ordenada por updatedAt, que deve refletir a última mensagem
        await this.orm.ticket.update({ where: { id: ticketId }, data: { updatedAt: new Date() } })

        return message
    }

    update(ticketId: string, data: UpdateTicketRepositoryDTO): Promise<Ticket> {
        return this.orm.ticket.update({ where: { id: ticketId }, data })
    }

    addEvent(data: CreateTicketEventRepositoryDTO): Promise<TicketEvent> {
        return this.orm.ticketEvent.create({ data })
    }

    findAttachmentById(attachmentId: string): Promise<AttachmentWithOwnerDTO | null> {
        return this.orm.ticketAttachment.findUnique({
            where: { id: attachmentId },
            include: { message: { select: { ticket: { select: { userId: true } } } } }
        })
    }

    async countByStatus(): Promise<Record<TicketStatus, number>> {
        const groups = await this.orm.ticket.groupBy({ by: ["status"], _count: { _all: true } })

        const result: Record<TicketStatus, number> = { OPEN: 0, IN_PROGRESS: 0, ANSWERED: 0, CLOSED: 0 }
        groups.forEach(group => { result[group.status] = group._count._all })
        return result
    }
}
