import type { User } from "@prisma/client"
import type { IHashUtils } from "../../hash/interfaces/hash-utils.interface"
import type { IUserRepository } from "../interfaces/user-repository.interface"
import { UserService } from "./user.service"
import { ValidationError } from "../../../shared/errors/validation-error"

describe('user service tests', () => {
    const makeUser = (overrides?: Partial<User>):User => ({
                id: "1",
                name: "Test",
                username: "test",
                role: "USER",
                birthDate: new Date("2000-01-01"),
                createdAt: new Date(),
                updatedAt: new Date(),
                password: "hashed password",
                deletedAt: null,
                ...overrides
            })

    const repositoryMock: jest.Mocked<IUserRepository> = {
        create: jest.fn(),
        findById: jest.fn(),
        findByUsername: jest.fn(),
        update: jest.fn(),
        updatePassword: jest.fn(),
        softDelete: jest.fn()
    }

    const hashMock: jest.Mocked<IHashUtils> = {
        hashPassword: jest.fn(),
        comparePassword: jest.fn()
    }

    const service = new UserService(repositoryMock, hashMock)

    describe('create user tests', () => {

        beforeEach(() => {
            jest.clearAllMocks()
        })

        it('should create a user successfully', async () => {
            const mockUserReturn = makeUser()
            repositoryMock.findByUsername.mockResolvedValue(null)
            hashMock.hashPassword.mockResolvedValue('hashed password')

            repositoryMock.create.mockResolvedValue(mockUserReturn);

            const result = await service.create({
                name: "Test",
                username: "test",
                password: "123",
                birthDate: '01/01/2000'
            })

            expect(result).not.toHaveProperty('password')
            expect(result).not.toHaveProperty('deletedAt')
            expect(result).toHaveProperty('id')
            expect(hashMock.hashPassword).toHaveBeenCalledWith('123')
            expect(repositoryMock.create).toHaveBeenCalledWith({
                name: "Test",
                username: "test",
                password: "hashed password",
                birthDate: new Date(Date.UTC(2000, 0, 1)),
            });





        })

        it('should return an error because the username already exists', async () => {
            repositoryMock.findByUsername.mockResolvedValue(makeUser())

            const user = service.create({
                name: "test",
                username: "test",
                password: "test",
                birthDate: "11/11/2000"
            })

            expect(hashMock.hashPassword).not.toHaveBeenCalled()
            await expect(user).rejects.toBeInstanceOf(ValidationError)
            await expect(user).rejects.toThrow('Insira outro nome de usuário')
            expect(repositoryMock.create).not.toHaveBeenCalled()
        })

        it("should return an error because the birthdate is invaid", async () => {
            repositoryMock.findByUsername.mockResolvedValue(null)
            hashMock.hashPassword.mockResolvedValue('hashed password')

            const result = service.create({
                name: "Test",
                username: "test",
                password: "123",
                birthDate: '31/02/2000'
            })

            expect(repositoryMock.create).not.toHaveBeenCalled()
            await expect(result).rejects.toThrow('Data inválida!')
            await expect(result).rejects.toBeInstanceOf(ValidationError)

            
        })

        it("should return an error because the birthdate is later than the current date", async () => {
            repositoryMock.findByUsername.mockResolvedValue(null)
            hashMock.hashPassword.mockResolvedValue('hashed password')

            const year = new Date().getFullYear() + 1

            const result = service.create({
                name: "Test",
                username: "test",
                password: "123",
                birthDate: `01/01/${year}`
            })

            expect(repositoryMock.create).not.toHaveBeenCalled()
            await expect(result).rejects.toThrow('Data de nascimento maior que a data atual')
            await expect(result).rejects.toBeInstanceOf(ValidationError)
            
        })


    })

})