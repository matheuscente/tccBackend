import { prismaTests } from "../../../lib/prisma-tests";
import { UserRepository } from "./user.repository";
import type { CreateUserDTO } from "../DTOs/create-user.dto";
import type { User } from "@prisma/client";
import { makeUser } from "../../../tests/factories/make-user";

describe('UserRepository tests', () => {
    const repository = new UserRepository(prismaTests)
    let user: User

    beforeAll(async () => {
        await prismaTests.$connect()
    })

    afterAll(async () => {
        await prismaTests.$disconnect()
    })

    beforeEach(async () => {

        user = await repository.create(
            makeUser({ username: "test" })
        )
    })

    afterEach(async () => {
        await prismaTests.user.deleteMany()
    })

    describe("create tests", () => {
        it('should create a user', async () => {
            const createdUser: CreateUserDTO = {
                name: "create test",
                username: `test_${Date.now()}`,
                password: "create test",
                birthDate: new Date('2000-01-01')
            }

            const userReturns = await repository.create(createdUser)

            expect(userReturns).not.toBeNull()
            expect(userReturns?.name).toBe(createdUser.name)
            expect(userReturns?.username).toBe(createdUser.username)
            expect(userReturns?.birthDate).toEqual(createdUser.birthDate)
            expect(userReturns?.id).toBeDefined()
        })

        it("It should return an error because an active user with the given username already exists in the database.", async () => {
            await expect(repository.create(makeUser({ username: "test" }))).rejects.toThrow()
        })


        it("It should not return an error, as there is no active user with the provided username in the database.", async () => {
            await prismaTests.user.update({
                where: { id: user.id },
                data: {
                    deletedAt: new Date()
                }
            })

            const deletedUser = await prismaTests.user.findFirst({
                where: { id: user.id }
            })

            expect(deletedUser?.deletedAt).not.toBeNull()

            await expect(repository.create(makeUser({ username: "test" }))).resolves.not.toThrow()
        })
    })


    describe("findById tests", () => {
        it("should find user by id", async () => {
            const result = await repository.findById(user.id)

            expect(result).not.toBeNull()
            expect(result?.id).toBe(user.id)
        })

        it("should return null if user does not exist", async () => {
            const result = await repository.findById("fake-id")

            expect(result).toBeNull()
        })

        it("should not return soft deleted user", async () => {
            await repository.softDelete(user.id)

            const result = await repository.findById(user.id)

            expect(result).toBeNull()
        })
    })

    describe("findByUsername tests", () => {
        it("should not return soft deleted user", async () => {
            await prismaTests.user.update({
                where: { id: user.id },
                data: {
                    deletedAt: new Date()
                }
            })

            const result = await repository.findByUsername(user.username)

            expect(result).toBeNull()
        })
        it('should find user by username', async () => {
            const userReturns = await repository.findByUsername(user.username)

            expect(userReturns).not.toBeNull()
            expect(userReturns).toEqual(user)

        })
    })

    describe("update tests", () => {
        it("should throw if user does not exist", async () => {
            await expect(
                repository.update("fake-id", { name: "test" })
            ).rejects.toThrow()
        })
        it('should update user', async () => {
            const updated = await repository.update(user.id, {
                name: 'test updated'
            })

            expect(updated.name).toBe('test updated')
        })

        it("It should return an error because an active user with the given username already exists in the database.", async () => {
            const user2 = await prismaTests.user.create(
                {
                    data: makeUser()
                })

            await expect(repository.update(user2.id, { username: user.username })).rejects.toThrow()

        })


        it("It should not return an error, as there is no active user with the provided username in the database.", async () => {
            await prismaTests.user.update({
                where: { id: user.id },
                data: {
                    deletedAt: new Date()
                }
            })

            const deletedUser = await prismaTests.user.findFirst({
                where: { id: user.id }
            })

            const user2 = await prismaTests.user.create({ data: makeUser() })

            expect(deletedUser?.deletedAt).not.toBeNull()

            await expect(repository.update(user2.id, { username: user.username })).resolves.not.toThrow()
        })
    })

    describe("softDelete tests", () => {

        it('should soft delete user', async () => {
            await repository.softDelete(user.id)

            const deleted = await prismaTests.user.findFirst({ where: { id: user.id } })

            expect(deleted).not.toBeNull()
            expect(deleted?.deletedAt).not.toBeNull()
        })

    })

    describe("updatePassword tests", () => {
        it('should update the user password', async () => {

            await repository.updatePassword(user.id, 'new password')

            const newPassword = (await repository.findById(user.id))?.password

            expect(newPassword).toBe('new password')
        })
    })
})