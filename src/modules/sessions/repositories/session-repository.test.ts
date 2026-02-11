import type { Session, User } from "@prisma/client"
import { prismaTests } from "../../../lib/prisma-tests"
import type { CreateSessionDTO } from "../DTOs/create-session.dto"
import { SessionRepository } from "./session.repository"
import { UserRepository } from "../../users/repositories/user.repository"
import { randomUUID } from "crypto"


describe('SessionRepository tests', () => {
    const repository = new SessionRepository(prismaTests)
    const userRepository = new UserRepository(prismaTests)

    let session: Session,
        user: User,
        refreshToken: string,
        userId: string

    const makeSession = (userId: string): CreateSessionDTO => {
        return {
            userId: userId,
            refreshToken: randomUUID(),
            expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24)
        }
    }

    beforeAll(async () => {

        await prismaTests.$connect()

        user = await userRepository.create({
            name: "test",
            username: "test",
            password: "test",
            birthDate: new Date("2000-01-01")

        })

    })

    afterAll(async () => {
        await prismaTests.$disconnect()
    })

    beforeEach(async () => {

        session = await repository.create(makeSession(user.id))
        refreshToken = session.refreshToken
        userId = session.userId
    })

    afterEach(async () => {
        await prismaTests.session.deleteMany()
    })

    describe("create tests", () => {
        it('should create a session', async () => {
            const createdSession: CreateSessionDTO = makeSession(user.id)

            const sessionReturns = await repository.create(createdSession)

            //integrity test
            expect(sessionReturns).not.toBeNull()

            //isValid test
            expect(sessionReturns?.isValid).toBe(true)

            //createdAt test
            expect(sessionReturns).toHaveProperty("createdAt")

            //createdAt test
            expect(sessionReturns?.createdAt).not.toBe(null)

            //refreshToken test
            expect(sessionReturns?.refreshToken).toEqual(createdSession.refreshToken)

            //expiresAt test
            expect(sessionReturns?.expiresAt).toEqual(createdSession.expiresAt)

            //userId test
            expect(sessionReturns?.userId).toEqual(createdSession.userId)

            //id test
            expect(sessionReturns?.id).toBeDefined()

            //updatedAt test
            expect(sessionReturns?.updatedAt).not.toBe(null)
            expect(sessionReturns?.updatedAt).toBeInstanceOf(Date)

        })
    })

    describe("findByUserId tests", () => {
        it('should find a session by userId', async () => {

            const sessionReturns: Session[] = await repository.findByUserId(userId)

            expect(sessionReturns).not.toBeNull()

            expect(sessionReturns.length).toBe(1)

            expect(sessionReturns[0]).toMatchObject({
                id: session.id,
                refreshToken: session.refreshToken,
                userId: session.userId,
                isValid: true,
                createdAt: session.createdAt,
                updatedAt: session.updatedAt,

            })

        })

        it('It should return null because there is no session with the userId provided in the database', async () => {

            const sessionReturns: Session[] = await repository.findByUserId('123')

            expect(sessionReturns.length).toBe(0)

        })
    })

    describe("findByRefreshToken tests", () => {
        it('should find a session by refresh token', async () => {

            const sessionReturns: Session | null = await repository.findByRefreshToken(refreshToken)

            expect(sessionReturns).not.toBeNull()

            expect(sessionReturns).toMatchObject({
                id: session.id,
                refreshToken: session.refreshToken,
                userId: session.userId,
                isValid: true,
                createdAt: session.createdAt,
                updatedAt: session.updatedAt,

            })
        })

        it('It should return null because there is no session with the refresh token provided in the database', async () => {

            const sessionReturns: Session | null = await repository.findByRefreshToken(randomUUID())

            expect(sessionReturns).toBeNull()

        })
    })

    describe('invalidate tests', () => {
        it('should invalidate a session', async () => {
            await repository.invalidate(session.id)

            const invalidSession = await repository.findByRefreshToken(refreshToken)

            expect(invalidSession?.isValid).toBe(false)
        })
    })

})