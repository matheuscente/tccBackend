import type { Prisma, PrismaClient, Ticket, TicketMessage, TicketStatus } from "@prisma/client";
import type { AttachmentInputDTO, CreateTicketRepositoryDTO, TicketFilterDTO, TicketWithMessagesDTO, TicketWithSummaryDTO } from "../DTOs/ticket.DTO";
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

    findAll(filter: TicketFilterDTO & { userId?: string }): Promise<TicketWithSummaryDTO[]> {
        return this.orm.ticket.findMany({
            where: {
                ...(filter.userId ? { userId: filter.userId } : {}),
                ...(filter.status ? { status: filter.status } : {}),
                ...(filter.search ? {
                    OR: [
                        { subject: { contains: filter.search, mode: "insensitive" } },
                        { user: { name: { contains: filter.search, mode: "insensitive" } } },
                        { user: { username: { contains: filter.search, mode: "insensitive" } } }
                    ]
                } : {})
            },
            include: {
                user: { select: { id: true, name: true, username: true } },
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

        // atualiza o updatedAt do chamado para ordenar pela última interação
        await this.orm.ticket.update({ where: { id: ticketId }, data: { updatedAt: new Date() } })

        return message
    }

    updateStatus(ticketId: string, status: TicketStatus): Promise<Ticket> {
        return this.orm.ticket.update({
            where: { id: ticketId },
            data: {
                status,
                closedAt: status === "CLOSED" ? new Date() : null
            }
        })
    }

    findAttachmentById(attachmentId: string) {
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
