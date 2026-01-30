import type { CreateUserDTO } from "../DTOs/create-user.dto";
import type { UpdateUserDTO } from "../DTOs/update-user.dto";
import type { UserResponseDTO } from "../DTOs/user-response.dto";
import type { IUserService } from "../interfaces/user-service.interface";
import { ValidationError } from "../../../shared/errors/validation-error";
import type { IUserRepository } from "../interfaces/user-repository.interface";

export class UserService implements IUserService {
    constructor(private repository: IUserRepository) { }

    async create(data: CreateUserDTO): Promise<UserResponseDTO> {
        throw new Error("Method not implemented.");
    }
    async findById(id: string): Promise<UserResponseDTO | null> {

        /*         const user: User | null = await this.repository.findById(id)
        if (!user) return user
        const age: number = this.userAge(user.birthDate)*/
        throw new Error("Method not implemented.");


    }
    async findByUsername(username: string): Promise<UserResponseDTO | null> {
        throw new Error("Method not implemented.");
    }
    async update(id: string, data: UpdateUserDTO): Promise<UserResponseDTO> {
        throw new Error("Method not implemented.");
    }
    async softDelete(id: string): Promise<void> {
        throw new Error("Method not implemented.");
    }

    private dateFormat(date: string): Date {
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


    private isValidBirthDate(date: Date): boolean {
        const now = new Date()
        const todayUTC = new Date(Date.UTC(
            now.getUTCFullYear(),
            now.getUTCMonth(),
            now.getUTCDate()
        ))

        return date.getTime() <= todayUTC.getTime()
    }


    private userAge(birthDate: Date): number {
         throw new ValidationError('Data inválida!')

    }

}