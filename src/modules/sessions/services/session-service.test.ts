import type { Session } from "@prisma/client";
import type { IHashUtils } from "../../../shared/hash/interfaces/hash-utils.interface";
import type { ISessionRepository } from "../interfaces/session-repository.interface"
import { SessionService } from "./session.service";

describe('Session service test', () => {

    const makeSession = (overrrides?: Partial<Session>): Session => ({
        id: "session-id",
        userId: "user-id",
        refreshToken: "hashed-secret",
        expiresAt: new Date(Date.now() + 100000),
        isValid: true,
        createdAt: new Date(Date.now()),
        updatedAt: new Date(Date.now()),
        ...overrrides
    })


    const repositoryMock: jest.Mocked<ISessionRepository> = {
        create: jest.fn(),
        findByUserId: jest.fn(),
        findById: jest.fn(),
        invalidate: jest.fn()
    }

    const hashMock: jest.Mocked<IHashUtils> = {
        hash: jest.fn(),
        compare: jest.fn(),
    };

    const service = new SessionService(repositoryMock, hashMock)


    beforeEach(() => {
        jest.resetAllMocks();
    });

    describe("createSession tests", () => {

        const userId = "user-id"

        it("should create a new session and return new refresh token", async () => {
            hashMock.hash.mockResolvedValue("hashed-secret")
            repositoryMock.create.mockResolvedValue(makeSession({ userId }))

            const session = await service.createSession(userId)


            expect(hashMock.hash).toHaveBeenCalledTimes(1)
            expect(repositoryMock.create).toHaveBeenCalledTimes(1)
            expect(repositoryMock.create).toHaveBeenCalledWith(expect.objectContaining({
                userId,
                refreshToken: "hashed-secret",
                expiresAt: expect.any(Date),
            })
            )
            expect(session.expiresAt).toBeInstanceOf(Date)
            expect(session.expiresAt.getTime()).toBeGreaterThan(Date.now())

            const [sessionId, secret] = session.refreshToken.split('.')

            expect(sessionId).toBe("session-id")
            expect(secret).toBeDefined()
            expect(secret).not.toBe("hashed-secret")

            //ensures that the hash was called with exactly the value passed to it.
            const hashValue = hashMock.hash.mock.calls[0]![0]

            expect(secret).toBe(hashValue)

        })

        it("should throw an error due to hash failure", async () => {
            hashMock.hash.mockRejectedValue(new Error("hash error"))

            await expect(service.createSession(userId))
                .rejects
                .toThrow("hash error")
            
            expect(repositoryMock.create).not.toHaveBeenCalled()

        })

        it("should throw an error due to repository failure", async () => {
            repositoryMock.create.mockRejectedValue(new Error("db error"))

            await expect(service.createSession(userId))
                .rejects
                .toThrow("db error")

            expect(hashMock.hash).toHaveBeenCalled()

        })
    })
})
