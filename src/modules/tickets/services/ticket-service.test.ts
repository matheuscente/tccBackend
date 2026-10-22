import { AuthorizationError } from "../../../shared/errors/authorization.error";
import { ForbiddenError } from "../../../shared/errors/forbidden.error";
import { NotFoundError } from "../../../shared/errors/not-found-error";
import { ValidationError } from "../../../shared/errors/validation-error";
import type { IStorageProvider } from "../../../shared/storage/interfaces/storage-provider.interface";
import type { IFileTokenService } from "../../../shared/file-token/interfaces/file-token-service.interface";
import type { AuthUserDTO } from "../../../shared/DTOs/auth-user.DTO";
import type { ITicketRepository } from "../interfaces/repositories/ticket-repository.interface";
import type { ITransaction } from "../../transaction/interfaces/transaction.interface";
import type { IRepositories } from "../../transaction/interfaces/repositories.interface";
import type { Ticket, TicketMessage } from "@prisma/client";
import { makeUploadedFile } from "../../../tests/factories/make-file";
import { makeTicket, makeTicketAttachment, makeTicketWithMessages, makeTicketWithSummary } from "../../../tests/factories/make-ticket";
import { TicketService } from "./ticket.service";

describe("TicketService", () => {

  const ticketRepositoryMock: jest.Mocked<ITicketRepository> = {
    create: jest.fn(),
    findById: jest.fn(),
    findByIdWithMessages: jest.fn(),
    findAll: jest.fn(),
    addMessage: jest.fn(),
    updateStatus: jest.fn(),
    findAttachmentById: jest.fn(),
    countByStatus: jest.fn(),
  };

  const storageMock: jest.Mocked<IStorageProvider> = {
    name: "local",
    put: jest.fn(),
    getStream: jest.fn(),
    delete: jest.fn(),
  };

  const fileTokenServiceMock: jest.Mocked<IFileTokenService> = {
    sign: jest.fn(),
    verify: jest.fn(),
  };

  const transactionMock: jest.Mocked<ITransaction> = {
    execute: jest.fn().mockImplementation(async (work) => work({ ticketRepository: ticketRepositoryMock } as unknown as IRepositories)),
  };

  const adminAuthUser: AuthUserDTO = { id: "admin-id", role: "ADMIN", sessionId: "default" };
  const userAuthUser: AuthUserDTO = { id: "user-id", role: "USER", sessionId: "default" };

  const publicApiUrl = "http://api.test";

  const service = new TicketService(ticketRepositoryMock, storageMock, fileTokenServiceMock, publicApiUrl, transactionMock);

  const makeImage = (name = "print.png") => makeUploadedFile({ originalname: name, mimetype: "image/png", size: 10 });

  const mockDetail = (ticket: Ticket) => {
    ticketRepositoryMock.findByIdWithMessages.mockResolvedValue(makeTicketWithMessages(ticket));
  };

  beforeEach(() => {
    jest.clearAllMocks();
    storageMock.put.mockResolvedValue();
    storageMock.delete.mockResolvedValue();
    fileTokenServiceMock.sign.mockReturnValue("signed-token");
    ticketRepositoryMock.addMessage.mockResolvedValue({} as TicketMessage);
  });

  describe("create", () => {
    it("should create a ticket with the first message and images", async () => {
      const ticket = makeTicket({ userId: userAuthUser.id });
      ticketRepositoryMock.create.mockResolvedValue(ticket);
      mockDetail(ticket);

      const result = await service.create(userAuthUser, { subject: "  help ", category: "PROBLEM", message: " it broke " }, [makeImage("a.PNG"), makeImage("b.jpg")]);

      expect(storageMock.put).toHaveBeenCalledTimes(2);
      expect(storageMock.put.mock.calls[0]![0]).toMatch(/^tickets\/user-id\/[0-9a-f-]{36}\.png$/);
      expect(storageMock.put.mock.calls[1]![0]).toMatch(/\.jpg$/);
      expect(ticketRepositoryMock.create).toHaveBeenCalledWith({
        userId: userAuthUser.id,
        subject: "help",
        category: "PROBLEM",
        message: {
          authorId: userAuthUser.id,
          content: "it broke",
          attachments: [
            { originalName: "a.PNG", mimeType: "image/png", size: 10, storageKey: storageMock.put.mock.calls[0]![0] },
            { originalName: "b.jpg", mimeType: "image/png", size: 10, storageKey: storageMock.put.mock.calls[1]![0] },
          ],
        },
      });
      expect(ticketRepositoryMock.findByIdWithMessages).toHaveBeenCalledWith(ticket.id);
      expect(result.id).toBe(ticket.id);
    });

    it("should throw ValidationError when more than 5 images are sent", async () => {
      const images = Array.from({ length: 6 }, () => makeImage());

      await expect(service.create(userAuthUser, { subject: "s", category: "DOUBT", message: "m" }, images)).rejects.toThrow("Envie no máximo 5 imagens");
      expect(storageMock.put).not.toHaveBeenCalled();
      expect(ticketRepositoryMock.create).not.toHaveBeenCalled();
    });

    it("should remove stored images when ticket creation fails", async () => {
      ticketRepositoryMock.create.mockRejectedValue(new Error("db error"));

      await expect(service.create(userAuthUser, { subject: "s", category: "DOUBT", message: "m" }, [makeImage(), makeImage()])).rejects.toThrow("db error");

      expect(storageMock.delete).toHaveBeenCalledTimes(2);
      expect(storageMock.delete).toHaveBeenCalledWith(storageMock.put.mock.calls[0]![0]);
      expect(storageMock.delete).toHaveBeenCalledWith(storageMock.put.mock.calls[1]![0]);
    });

    it("should remove already stored images when a later upload fails", async () => {
      storageMock.put.mockResolvedValueOnce().mockRejectedValueOnce(new Error("storage error"));

      await expect(service.create(userAuthUser, { subject: "s", category: "DOUBT", message: "m" }, [makeImage(), makeImage()])).rejects.toThrow("storage error");

      expect(storageMock.delete).toHaveBeenCalledTimes(1);
      expect(storageMock.delete).toHaveBeenCalledWith(storageMock.put.mock.calls[0]![0]);
      expect(ticketRepositoryMock.create).not.toHaveBeenCalled();
    });
  });

  describe("findAll", () => {
    it("should restrict USER to their own tickets", async () => {
      ticketRepositoryMock.findAll.mockResolvedValue([]);

      await service.findAll(userAuthUser, { status: "OPEN" });

      expect(ticketRepositoryMock.findAll).toHaveBeenCalledWith({ status: "OPEN", userId: userAuthUser.id });
    });

    it("should let ADMIN see all tickets", async () => {
      ticketRepositoryMock.findAll.mockResolvedValue([]);

      await service.findAll(adminAuthUser, { search: "abc" });

      expect(ticketRepositoryMock.findAll).toHaveBeenCalledWith({ search: "abc" });
    });

    it("should map the summary with the last message info", async () => {
      const ticket = makeTicket({ userId: userAuthUser.id, status: "CLOSED", closedAt: new Date("2026-03-01T00:00:00Z") });
      const lastMessageAt = new Date("2026-02-01T00:00:00Z");
      ticketRepositoryMock.findAll.mockResolvedValue([
        makeTicketWithSummary(ticket, { _count: { messages: 3 }, messages: [{ createdAt: lastMessageAt, author: { role: "ADMIN" } }] }),
        makeTicketWithSummary(makeTicket()),
      ]);

      const [first, second] = await service.findAll(userAuthUser, {});

      expect(first).toEqual(expect.objectContaining({
        id: ticket.id,
        status: "CLOSED",
        messageCount: 3,
        lastMessageAt: lastMessageAt.toISOString(),
        lastMessageByAdmin: true,
        closedAt: "2026-03-01T00:00:00.000Z",
      }));
      expect(second).toEqual(expect.objectContaining({ messageCount: 0, lastMessageAt: null, lastMessageByAdmin: false, closedAt: null }));
    });
  });

  describe("findById", () => {
    it("should return the owner's ticket with signed attachment urls", async () => {
      const ticket = makeTicket({ userId: userAuthUser.id });
      const attachment = makeTicketAttachment();
      ticketRepositoryMock.findById.mockResolvedValue(ticket);
      ticketRepositoryMock.findByIdWithMessages.mockResolvedValue(makeTicketWithMessages(ticket, {
        messages: [{
          id: "message-id",
          ticketId: ticket.id,
          authorId: userAuthUser.id,
          content: "hello",
          createdAt: new Date("2026-01-01T00:00:00Z"),
          author: { id: userAuthUser.id, name: "user", role: "USER" },
          attachments: [attachment],
        }],
      }));
      fileTokenServiceMock.sign.mockReturnValue("a+b");

      const result = await service.findById(userAuthUser, ticket.id);

      expect(fileTokenServiceMock.sign).toHaveBeenCalledWith({ sub: attachment.id, kind: "attachment" });
      expect(result.user).toEqual({ id: userAuthUser.id, name: "test", username: "test" });
      expect(result.messages[0]!.attachments[0]).toEqual({
        id: attachment.id,
        originalName: attachment.originalName,
        mimeType: attachment.mimeType,
        size: attachment.size,
        url: `${publicApiUrl}/tickets/attachments/${attachment.id}/content?token=a%2Bb`,
      });
      expect(result.messages[0]!.attachments[0]).not.toHaveProperty("storageKey");
    });

    it("should let ADMIN see any ticket", async () => {
      const ticket = makeTicket({ userId: userAuthUser.id });
      ticketRepositoryMock.findById.mockResolvedValue(ticket);
      mockDetail(ticket);

      await expect(service.findById(adminAuthUser, ticket.id)).resolves.toEqual(expect.objectContaining({ id: ticket.id }));
    });

    it("should throw ForbiddenError when USER accesses another user's ticket", async () => {
      ticketRepositoryMock.findById.mockResolvedValue(makeTicket({ userId: "other-user" }));

      await expect(service.findById(userAuthUser, "id")).rejects.toThrow(ForbiddenError);
      expect(ticketRepositoryMock.findByIdWithMessages).not.toHaveBeenCalled();
    });

    it("should throw NotFoundError when ticket does not exist", async () => {
      ticketRepositoryMock.findById.mockResolvedValue(null);

      await expect(service.findById(userAuthUser, "missing")).rejects.toThrow("Chamado não encontrado");
    });
  });

  describe("addMessage", () => {
    it("should set status to ANSWERED when ADMIN replies", async () => {
      const ticket = makeTicket({ userId: userAuthUser.id, status: "OPEN" });
      ticketRepositoryMock.findById.mockResolvedValue(ticket);
      mockDetail(ticket);

      await service.addMessage(adminAuthUser, ticket.id, { message: " reply " }, []);

      expect(ticketRepositoryMock.addMessage).toHaveBeenCalledWith(ticket.id, adminAuthUser.id, "reply", []);
      expect(ticketRepositoryMock.updateStatus).toHaveBeenCalledWith(ticket.id, "ANSWERED");
    });

    it("should set status back to OPEN when the user replies", async () => {
      const ticket = makeTicket({ userId: userAuthUser.id, status: "ANSWERED" });
      ticketRepositoryMock.findById.mockResolvedValue(ticket);
      mockDetail(ticket);

      await service.addMessage(userAuthUser, ticket.id, { message: "thanks" }, []);

      expect(ticketRepositoryMock.updateStatus).toHaveBeenCalledWith(ticket.id, "OPEN");
    });

    it("should set status back to OPEN when the user replies to an IN_PROGRESS ticket", async () => {
      const ticket = makeTicket({ userId: userAuthUser.id, status: "IN_PROGRESS" });
      ticketRepositoryMock.findById.mockResolvedValue(ticket);
      mockDetail(ticket);

      await service.addMessage(userAuthUser, ticket.id, { message: "any news?" }, []);

      expect(ticketRepositoryMock.updateStatus).toHaveBeenCalledWith(ticket.id, "OPEN");
    });

    it("should not update status when it does not change", async () => {
      const ticket = makeTicket({ userId: userAuthUser.id, status: "OPEN" });
      ticketRepositoryMock.findById.mockResolvedValue(ticket);
      mockDetail(ticket);

      await service.addMessage(userAuthUser, ticket.id, { message: "more info" }, []);

      expect(ticketRepositoryMock.updateStatus).not.toHaveBeenCalled();
    });

    it("should treat an ADMIN replying to their own ticket as the user (OPEN)", async () => {
      const ticket = makeTicket({ userId: adminAuthUser.id, status: "ANSWERED" });
      ticketRepositoryMock.findById.mockResolvedValue(ticket);
      mockDetail(ticket);

      await service.addMessage(adminAuthUser, ticket.id, { message: "m" }, []);

      expect(ticketRepositoryMock.updateStatus).toHaveBeenCalledWith(ticket.id, "OPEN");
    });

    it("should reject messages on a closed ticket", async () => {
      ticketRepositoryMock.findById.mockResolvedValue(makeTicket({ userId: userAuthUser.id, status: "CLOSED" }));

      await expect(service.addMessage(userAuthUser, "id", { message: "m" }, [makeImage()])).rejects.toThrow("Este chamado está encerrado");
      await expect(service.addMessage(adminAuthUser, "id", { message: "m" }, [])).rejects.toThrow(ValidationError);
      expect(storageMock.put).not.toHaveBeenCalled();
      expect(ticketRepositoryMock.addMessage).not.toHaveBeenCalled();
      expect(ticketRepositoryMock.updateStatus).not.toHaveBeenCalled();
    });

    it("should store images under the ticket owner's folder", async () => {
      const ticket = makeTicket({ userId: userAuthUser.id, status: "OPEN" });
      ticketRepositoryMock.findById.mockResolvedValue(ticket);
      mockDetail(ticket);

      await service.addMessage(adminAuthUser, ticket.id, { message: "see image" }, [makeImage()]);

      expect(storageMock.put.mock.calls[0]![0]).toMatch(/^tickets\/user-id\//);
      expect(ticketRepositoryMock.addMessage).toHaveBeenCalledWith(ticket.id, adminAuthUser.id, "see image", [
        expect.objectContaining({ storageKey: storageMock.put.mock.calls[0]![0] }),
      ]);
    });

    it("should remove stored images and keep status when saving the message fails", async () => {
      const ticket = makeTicket({ userId: userAuthUser.id, status: "OPEN" });
      ticketRepositoryMock.findById.mockResolvedValue(ticket);
      ticketRepositoryMock.addMessage.mockRejectedValue(new Error("db error"));

      await expect(service.addMessage(adminAuthUser, ticket.id, { message: "m" }, [makeImage()])).rejects.toThrow("db error");

      expect(storageMock.delete).toHaveBeenCalledWith(storageMock.put.mock.calls[0]![0]);
      expect(ticketRepositoryMock.updateStatus).not.toHaveBeenCalled();
    });

    it("should save the message and the new status in the same transaction", async () => {
      const ticket = makeTicket({ userId: userAuthUser.id, status: "OPEN" });
      ticketRepositoryMock.findById.mockResolvedValue(ticket);
      mockDetail(ticket);

      await service.addMessage(adminAuthUser, ticket.id, { message: "answer" }, []);

      expect(transactionMock.execute).toHaveBeenCalledTimes(1);
      expect(ticketRepositoryMock.addMessage).toHaveBeenCalledTimes(1);
      expect(ticketRepositoryMock.updateStatus).toHaveBeenCalledWith(ticket.id, "ANSWERED");
    });

    it("should remove stored images when the status update fails", async () => {
      const ticket = makeTicket({ userId: userAuthUser.id, status: "OPEN" });
      ticketRepositoryMock.findById.mockResolvedValue(ticket);
      ticketRepositoryMock.updateStatus.mockRejectedValueOnce(new Error("db error"));

      await expect(service.addMessage(adminAuthUser, ticket.id, { message: "m" }, [makeImage()])).rejects.toThrow("db error");

      expect(storageMock.delete).toHaveBeenCalledWith(storageMock.put.mock.calls[0]![0]);
      expect(ticketRepositoryMock.findByIdWithMessages).not.toHaveBeenCalled();
    });

    it("should throw ForbiddenError when USER writes on another user's ticket", async () => {
      ticketRepositoryMock.findById.mockResolvedValue(makeTicket({ userId: "other-user" }));

      await expect(service.addMessage(userAuthUser, "id", { message: "m" }, [])).rejects.toThrow(ForbiddenError);
      expect(ticketRepositoryMock.addMessage).not.toHaveBeenCalled();
    });

    it("should throw NotFoundError when ticket does not exist", async () => {
      ticketRepositoryMock.findById.mockResolvedValue(null);

      await expect(service.addMessage(userAuthUser, "missing", { message: "m" }, [])).rejects.toThrow(NotFoundError);
    });
  });

  describe("updateStatus", () => {
    it("should let the user close their own ticket", async () => {
      const ticket = makeTicket({ userId: userAuthUser.id, status: "ANSWERED" });
      ticketRepositoryMock.findById.mockResolvedValue(ticket);
      mockDetail(ticket);

      await service.updateStatus(userAuthUser, ticket.id, "CLOSED");

      expect(ticketRepositoryMock.updateStatus).toHaveBeenCalledWith(ticket.id, "CLOSED");
    });

    it.each(["OPEN", "IN_PROGRESS", "ANSWERED"] as const)("should not let the user set status %s", async (status) => {
      ticketRepositoryMock.findById.mockResolvedValue(makeTicket({ userId: userAuthUser.id, status: "CLOSED" }));

      await expect(service.updateStatus(userAuthUser, "id", status)).rejects.toThrow("Você pode apenas encerrar o chamado");
      expect(ticketRepositoryMock.updateStatus).not.toHaveBeenCalled();
    });

    it.each(["OPEN", "IN_PROGRESS", "ANSWERED", "CLOSED"] as const)("should let ADMIN set status %s", async (status) => {
      const ticket = makeTicket({ userId: userAuthUser.id, status: status === "OPEN" ? "CLOSED" : "OPEN" });
      ticketRepositoryMock.findById.mockResolvedValue(ticket);
      mockDetail(ticket);

      await service.updateStatus(adminAuthUser, ticket.id, status);

      expect(ticketRepositoryMock.updateStatus).toHaveBeenCalledWith(ticket.id, status);
    });

    it("should not update when status is unchanged", async () => {
      const ticket = makeTicket({ userId: userAuthUser.id, status: "CLOSED" });
      ticketRepositoryMock.findById.mockResolvedValue(ticket);
      mockDetail(ticket);

      await service.updateStatus(userAuthUser, ticket.id, "CLOSED");

      expect(ticketRepositoryMock.updateStatus).not.toHaveBeenCalled();
    });

    it("should throw ForbiddenError when USER closes another user's ticket", async () => {
      ticketRepositoryMock.findById.mockResolvedValue(makeTicket({ userId: "other-user" }));

      await expect(service.updateStatus(userAuthUser, "id", "CLOSED")).rejects.toThrow(ForbiddenError);
      expect(ticketRepositoryMock.updateStatus).not.toHaveBeenCalled();
    });

    it("should throw NotFoundError when ticket does not exist", async () => {
      ticketRepositoryMock.findById.mockResolvedValue(null);

      await expect(service.updateStatus(adminAuthUser, "missing", "OPEN")).rejects.toThrow(NotFoundError);
    });
  });

  describe("resolveAttachmentByToken", () => {
    it("should return the attachment when the token matches", async () => {
      const attachment = { ...makeTicketAttachment(), message: { ticket: { userId: userAuthUser.id } } };
      fileTokenServiceMock.verify.mockReturnValue({ sub: attachment.id, kind: "attachment" });
      ticketRepositoryMock.findAttachmentById.mockResolvedValue(attachment);

      const result = await service.resolveAttachmentByToken(attachment.id, "token");

      expect(fileTokenServiceMock.verify).toHaveBeenCalledWith("token", "attachment");
      expect(result).toBe(attachment);
    });

    it("should throw ForbiddenError when the token was issued for another attachment", async () => {
      fileTokenServiceMock.verify.mockReturnValue({ sub: "other-attachment", kind: "attachment" });

      await expect(service.resolveAttachmentByToken("attachment-id", "token")).rejects.toThrow(ForbiddenError);
      expect(ticketRepositoryMock.findAttachmentById).not.toHaveBeenCalled();
    });

    it("should propagate AuthorizationError for invalid tokens", async () => {
      fileTokenServiceMock.verify.mockImplementation(() => { throw new AuthorizationError("Link do arquivo inválido ou expirado") });

      await expect(service.resolveAttachmentByToken("attachment-id", "bad")).rejects.toThrow(AuthorizationError);
    });

    it("should throw NotFoundError when attachment does not exist", async () => {
      fileTokenServiceMock.verify.mockReturnValue({ sub: "attachment-id", kind: "attachment" });
      ticketRepositoryMock.findAttachmentById.mockResolvedValue(null);

      await expect(service.resolveAttachmentByToken("attachment-id", "token")).rejects.toThrow("Anexo não encontrado");
    });
  });
});
