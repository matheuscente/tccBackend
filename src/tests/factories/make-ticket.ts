import type { Ticket, TicketAttachment } from "@prisma/client";
import type { TicketWithMessagesDTO } from "../../modules/tickets/DTOs/ticket-with-messages.DTO";
import type { TicketWithSummaryDTO } from "../../modules/tickets/DTOs/ticket-with-summary.DTO";
import { randomUUID } from "node:crypto";

export const makeTicket = (overrides?: Partial<Ticket>): Ticket => ({
  id: randomUUID(),
  userId: randomUUID(),
  subject: `subject ${randomUUID()}`,
  category: "DOUBT",
  status: "OPEN",
  createdAt: new Date(),
  updatedAt: new Date(),
  closedAt: null,
  ...overrides
});

export const makeTicketAttachment = (overrides?: Partial<TicketAttachment>): TicketAttachment => ({
  id: randomUUID(),
  messageId: randomUUID(),
  originalName: "image.png",
  mimeType: "image/png",
  size: 2048,
  storageKey: `tickets/${randomUUID()}/${randomUUID()}.png`,
  createdAt: new Date(),
  ...overrides
});

export const makeTicketWithMessages = (ticket: Ticket, overrides?: Partial<TicketWithMessagesDTO>): TicketWithMessagesDTO => ({
  ...ticket,
  user: { id: ticket.userId, name: "test", username: "test", email: "test@test.com" },
  messages: [],
  ...overrides
});

export const makeTicketWithSummary = (ticket: Ticket, overrides?: Partial<TicketWithSummaryDTO>): TicketWithSummaryDTO => ({
  ...ticket,
  user: { id: ticket.userId, name: "test", username: "test" },
  _count: { messages: 0 },
  messages: [],
  ...overrides
});
