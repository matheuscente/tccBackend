import type { User } from "@prisma/client";
import { prismaTests } from "../../../lib/prisma-tests";
import { makeUser } from "../../../tests/factories/make-user";
import { makeTicket } from "../../../tests/factories/make-ticket";
import { UserRepository } from "../../users/repositories/user.repository";
import { TicketRepository } from "./ticket.repository";

describe("ticket repository tests", () => {
    const userRepository = new UserRepository(prismaTests);
    const ticketRepository = new TicketRepository(prismaTests);

    let student: User, admin: User, otherAdmin: User;

    beforeAll(async () => {
        await prismaTests.$connect();
    });

    afterAll(async () => {
        await prismaTests.$disconnect();
    });

    beforeEach(async () => {
        student = await userRepository.create(makeUser());
        admin = await userRepository.create(makeUser({ role: "ADMIN" }));
        otherAdmin = await userRepository.create(makeUser({ role: "ADMIN" }));
    });

    afterEach(async () => {
        await prismaTests.ticketEvent.deleteMany();
        await prismaTests.ticket.deleteMany();
        await prismaTests.user.deleteMany();
    });

    describe("releaseAssignedTo tests", () => {
        it("should return the admin tickets in progress to the queue and register an event", async () => {
            const inProgress = await prismaTests.ticket.create({
                data: makeTicket({ userId: student.id, status: "IN_PROGRESS", assignedToId: admin.id }),
            });

            const released = await ticketRepository.releaseAssignedTo(admin.id, otherAdmin.id);

            expect(released).toBe(1);
            const ticket = await prismaTests.ticket.findUnique({ where: { id: inProgress.id } });
            expect(ticket?.status).toBe("OPEN");
            expect(ticket?.assignedToId).toBeNull();

            const events = await prismaTests.ticketEvent.findMany({ where: { ticketId: inProgress.id } });
            expect(events).toHaveLength(1);
            expect(events[0]).toMatchObject({ type: "STATUS_CHANGED", status: "OPEN", actorId: otherAdmin.id, targetId: admin.id });
        });

        it("should not touch tickets of other admins or in other status", async () => {
            const fromOtherAdmin = await prismaTests.ticket.create({
                data: makeTicket({ userId: student.id, status: "IN_PROGRESS", assignedToId: otherAdmin.id }),
            });
            const answered = await prismaTests.ticket.create({
                data: makeTicket({ userId: student.id, status: "ANSWERED" }),
            });

            const released = await ticketRepository.releaseAssignedTo(admin.id, otherAdmin.id);

            expect(released).toBe(0);
            expect((await prismaTests.ticket.findUnique({ where: { id: fromOtherAdmin.id } }))?.assignedToId).toBe(otherAdmin.id);
            expect((await prismaTests.ticket.findUnique({ where: { id: answered.id } }))?.status).toBe("ANSWERED");
            expect(await prismaTests.ticketEvent.count()).toBe(0);
        });
    });
});
