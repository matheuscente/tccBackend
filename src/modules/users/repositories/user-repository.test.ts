import { prismaTests } from "../../../lib/prisma-tests";
import { UserRepository } from "./user.repository";
import type { CreateUserDTO } from "../DTOs/create-user.dto";

describe('UserRepository tests', () => {
    const repository = new UserRepository(prismaTests)
    let createUserId: string
    let createdUsername: string
    const user: CreateUserDTO = {
        name: "test",
        username: `test_${Date.now()}`,
        password: "test",
        birthDate: new Date('2000-01-01')
    }

    beforeAll(async () => {
        await prismaTests.$connect()
    })

    afterAll(async () => {
        await prismaTests.$disconnect()
    })

    beforeEach( async () => {
        createdUsername = `test_${Date.now()}`
        createUserId = (await repository.create({
            ...user,
            username: createdUsername
        })).id
    })

    afterEach(async () => {
        await prismaTests.user.deleteMany()
    })

    it('should create a user', async () => {
        const createdUser: CreateUserDTO = {
            name: "create test",
            username: `test_${Date.now()}`,
            password: "create test",
            birthDate: new Date('2000-01-01')
        }

        const userReturns =  await repository.create(createdUser)
        
        expect(userReturns).not.toBeNull()
        expect(userReturns?.name).toBe(createdUser.name)
        expect(userReturns?.username).toBe(createdUser.username)
        expect(userReturns?.birthDate).toEqual(createdUser.birthDate)
        expect(userReturns?.id).toBeDefined()
    })

    it('should find user by username', async () => {
        const userReturns = await repository.findByUsername(createdUsername)

        expect(userReturns).not.toBeNull()
        expect(userReturns?.name).toBe('test')
        
    })

    it('should update user', async () => {
        const updated = await repository.update(createUserId, {
           name: 'test updated' 
        })

        expect(updated.name).toBe('test updated')
    })

    it('should soft delete user', async () => {
        await repository.softDelete(createUserId)

        const deleted = await repository.findById(createUserId)

        expect(deleted?.deletedAt).not.toBeNull()
    })

        it('should update the user password', async () => {

        await repository.updatePassword(createUserId, 'new password')

        const newPassword = (await repository.findById(createUserId))?.password
        
        expect(newPassword).toBe('new password')
    })
})