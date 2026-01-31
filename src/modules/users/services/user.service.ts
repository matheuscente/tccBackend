import type { CreateUserDTO } from "../DTOs/create-user.dto";
import type { UpdateUserDTO } from "../DTOs/update-user.dto";
import type { UserResponseDTO } from "../DTOs/user-response.dto";
import type { IUserService } from "../interfaces/user-service.interface";
import { ValidationError } from "../../../shared/errors/validation-error";
import type { IUserRepository } from "../interfaces/user-repository.interface";
import type { User } from "@prisma/client";
import { NotFoundError } from "../../../shared/errors/not-found-error";

export class UserService implements IUserService {
    constructor(private repository: IUserRepository) { }

    async create(data: CreateUserDTO): Promise<UserResponseDTO> {
        throw new Error("Method not implemented.");
    }

    async findById(id: string): Promise<UserResponseDTO | null> {
        const user: User | null = await this.repository.findById(id)
        if (!user) return user
        
        const returnUser: UserResponseDTO = {
            id: user.id,
            name: user.name,
            username: user.username,
            role: user.role,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt
        }
        return returnUser 

    }

    async findByUsername(username: string): Promise<UserResponseDTO | null> {
        const user: User | null = await this.repository.findByUsername(username)
        if (!user) return user
        
        const returnUser: UserResponseDTO = {
            id: user.id,
            name: user.name,
            username: user.username,
            role: user.role,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt
        }
        return returnUser 
    }

    async update(id: string, data: UpdateUserDTO): Promise<UserResponseDTO> {
        throw new Error("Method not implemented.");
    }
    
    async softDelete(id: string): Promise<void> {
        const user = await this.findById(id)

        if (!user) throw new NotFoundError('usuario não encontrado')
        await this.softDelete(id)
        return
    }

    private extractDate(date: string): [number, number, number] {
        const parts = date.split('/')

        if (parts.length !== 3) {
            throw new ValidationError('Data inválida!')
        }
        const day = parseInt(parts[0]!, 10)
        const month = parseInt(parts[1]!, 10) - 1
        const year = parseInt(parts[2]!, 10)

        if ([day, month, year].some(Number.isNaN)) {
            throw new ValidationError('Data inválida!')
        }

        return [day, month, year]

    }

    private dateFormat(date: string): Date {
        const [day, month, year] = this.extractDate(date)

        const formatedDate = new Date(Date.UTC(year, month, day, 0, 0, 0))

        if (
            formatedDate.getUTCFullYear() !== year ||
            formatedDate.getUTCMonth() !== month ||
            formatedDate.getUTCDate() !== day
        ) {
            throw new ValidationError('Dia inválido para o mês informado!')
        }

        if (!this.isValidBirthDate(formatedDate)) throw new ValidationError("Data inválida")

        return formatedDate
    }

    private getCurrentDate(): Date {
        const now = new Date()
        return new Date(Date.UTC(
            now.getUTCFullYear(),
            now.getUTCMonth(),
            now.getUTCDate()
        ))
    } 


    private isValidBirthDate(date: Date): boolean {
        return date.getTime() <= this.getCurrentDate().getTime()
    }

}