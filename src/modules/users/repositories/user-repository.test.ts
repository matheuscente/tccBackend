import { UserRepository } from "./user.repository";
import type { CreateUserDTO } from "../DTOs/create-user.dto";
import { databaseTests } from "../../../database/database-config-tests";
import { deleteAllUsers } from "../querys/userQuerys";
import type { UserResponseDTO } from "../DTOs/user-response.dto";

describe('UserRepository tests', () => {
    const repository = new UserRepository(databaseTests)
    let createUserId: string
    let createdUsername: string
    const user: CreateUserDTO = {
        name: "test",
        username: `test_${Date.now()}`,
        password: "test",
        birthDate: 31102001,
        role: "USER"
    }

    let createdUser: UserResponseDTO;

    beforeEach( async () => {
        createdUsername = `test_${Date.now()}`
        const newUser = await repository.create({
            ...user,
            username: createdUsername
        })

        createUserId = newUser.id
        createdUser = newUser
    })

    afterEach(async () => {
        await databaseTests.execute(deleteAllUsers)
    })

    it('should create a user', async () => {
        const createdUser: CreateUserDTO = {
            name: "create test",
            username: `test_${Date.now()}`,
            password: "create test",
            birthDate: 31102001,
            role: "USER"
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
           username: createdUser.username,
           birthDate: createdUser.birthDate,
           role: createdUser.role,
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

        const newPassword = (await repository.getUserWithPassword(createdUsername))?.password
        
        expect(newPassword).toBe('new password')
    })
})