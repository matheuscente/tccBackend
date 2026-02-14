import type { Session } from "@prisma/client";
import type { IHashUtils } from "../../../shared/hash/interfaces/hash-utils.interface";
import type { ISessionRepository } from "../interfaces/session-repository.interface"
import { SessionService } from "./session.service";
import { NotFoundError } from "../../../shared/errors/not-found-error";

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

    describe("invalidationSession tests", () => {
        const session = makeSession()

        it("should invalidate a session", async () => {
            repositoryMock.findById.mockResolvedValue(session)
            const invalidSession = await service.invalidateSession(session.id)

            expect(invalidSession).toBe(undefined)
            expect(repositoryMock.findById).toHaveBeenCalledTimes(1)
            expect(repositoryMock.findById).toHaveBeenCalledWith(session.id)
            expect(repositoryMock.invalidate).toHaveBeenCalledTimes(1)
            expect(repositoryMock.invalidate).toHaveBeenCalledWith(session.id)



        })

        it("hould return undefined, but not throw an error because the session exists but is not valid", async () => {
            const session = makeSession({ isValid: false })
            repositoryMock.findById.mockResolvedValue(session)
            const invalidSession = await service.invalidateSession(session.id)

            expect(invalidSession).toBe(undefined)
            expect(repositoryMock.findById).toHaveBeenCalledTimes(1)
            expect(repositoryMock.findById).toHaveBeenCalledWith(session.id)
            expect(repositoryMock.invalidate).not.toHaveBeenCalled()
        })

        it("This should throw an error because the session does not exist", async () => {
            repositoryMock.findById.mockResolvedValue(null)
            const invalidSession = service.invalidateSession(session.id)

            await expect(invalidSession).rejects.toBeInstanceOf(NotFoundError)
            await expect(invalidSession).rejects.toThrow("sessão não encontrada")
            expect(repositoryMock.findById).toHaveBeenCalledTimes(1)
            expect(repositoryMock.findById).toHaveBeenCalledWith(session.id)
            expect(repositoryMock.invalidate).not.toHaveBeenCalled()
        })

        it("should throw an error due to repository findById failure", async () => {
            repositoryMock.findById.mockRejectedValue(new Error("db error"))

            await expect(service.invalidateSession(session.id))
                .rejects
                .toThrow("db error")

            expect(repositoryMock.invalidate).not.toHaveBeenCalled()

        })

        it("should throw an error due to repository invalidate failure", async () => {
            repositoryMock.findById.mockResolvedValue(session)
            repositoryMock.invalidate.mockRejectedValue(new Error("db error"))

            await expect(service.invalidateSession(session.id))
                .rejects
                .toThrow("db error")

            expect(repositoryMock.findById).toHaveBeenCalledTimes(1)
            expect(repositoryMock.invalidate).toHaveBeenCalledTimes(1)
        })

    })

    describe("refreshSession tests", () => {

        const sessionId = "123"
        const secret = "456"
        const refreshToken = `${sessionId}.${secret}`

    const session = makeSession({

                refreshToken: "hashed-secret",
                 id: sessionId
            })

    it("should refresh session successfully", async () => {
        
        repositoryMock.findById.mockResolvedValue(session)
        repositoryMock.invalidate.mockResolvedValue(undefined)
        //To avoid mocking the internal method, mock the repository's create method for the return value of createSession.
        repositoryMock.create.mockResolvedValue(makeSession())


        hashMock.compare.mockResolvedValue(true)

        const newSession = await service.refreshSession(refreshToken)

        expect(repositoryMock.findById).toHaveBeenCalledTimes(1)
        expect(repositoryMock.findById).toHaveBeenCalledWith(sessionId)

        expect(hashMock.compare).toHaveBeenCalledTimes(1)
        expect(hashMock.compare).toHaveBeenCalledWith(secret, session.refreshToken)

        expect(repositoryMock.invalidate).toHaveBeenCalledTimes(1)
        expect(repositoryMock.invalidate).toHaveBeenCalledWith(session.id)

        expect(newSession).toMatchObject({
            refreshToken: expect.any(String),
            expiresAt: expect.any(Date)
        })

    })

    it("should throw if token format is invalid", async () => {})

    it("should throw if session does not exist", async () => {})

    it("should throw if session is invalid", async () => {})

    it("should throw if session is expired", async () => {})

    it("should throw if secret does not match", async () => {})

    it("should propagate repository findById error", async () => {})

    it("should propagate compare error", async () => {})

    it("should propagate invalidate error", async () => {})

    it("should propagate create error", async () => {
         
        repositoryMock.findById.mockResolvedValue(session)
        repositoryMock.invalidate.mockResolvedValue(undefined)
        repositoryMock.create.mockRejectedValue(new Error("db error"))

        hashMock.compare.mockResolvedValue(true)

         await expect(service.refreshSession(refreshToken))
            .rejects
            .toThrow("db error")
        
        expect(repositoryMock.findById).toHaveBeenCalledTimes(1)
        expect(repositoryMock.findById).toHaveBeenCalledWith(sessionId)

        expect(hashMock.compare).toHaveBeenCalledTimes(1)
        expect(hashMock.compare).toHaveBeenCalledWith(secret, session.refreshToken)

        expect(repositoryMock.invalidate).toHaveBeenCalledTimes(1)
        expect(repositoryMock.invalidate).toHaveBeenCalledWith(session.id)

    })

})

})
