import type { CreateUserDTO } from "../DTOs/create-user.dto";
import type { UpdateUserDTO } from "../DTOs/update-user.dto";
import type { UserResponseDTO } from "../DTOs/user-response.dto";
import type { IUserService } from "../interfaces/user-service.interface";
import { ValidationError } from "../../../shared/errors/validation-error";
import type { IUserRepository } from "../interfaces/user-repository.interface";
import type { User } from "@prisma/client";
import { NotFoundError } from "../../../shared/errors/not-found-error";
import type { IHashProvider } from "../../../shared/hash/interfaces/hash-provider.interface";
import { InternalServerError } from "../../../shared/errors/internal-server-error";
import type { Isanitize } from "../../../shared/sanitize/interfaces/sanitize.interface";
import type { ITransaction } from "../../transaction/interfaces/transaction.interface";
import type { IOwnershipService } from "../../../shared/ownership/ownership-service.interface";
import type { AuthUserDTO } from "../../../shared/DTOs/auth-user.DTO";

export class UserService implements IUserService {
  constructor(
    private repository: IUserRepository,
    private hasher: IHashProvider,
    private sanitize: Isanitize,
    private transaction: ITransaction,
    private readonly ownership: IOwnershipService
  ) { }


  async updatePassword(authUser: AuthUserDTO, id: string, oldPassword: string, newPassword: string): Promise<void> {
    const user = await this.repository.findById(id)

    if (!user) throw new NotFoundError('usuário não encontrado')

    this.ownership.validateOwnership(authUser, user.id)

    const isPasswordOk = await this.hasher.compare(oldPassword, user.password)

    if (!isPasswordOk) throw new ValidationError("senha inválida!")

    const newHashedPassword = await this.hasher.hash(newPassword)

    await this.repository.updatePassword(id, newHashedPassword)
    return
  }

  async create(data: CreateUserDTO): Promise<UserResponseDTO> {

    const userExists = await this.repository.findByUsername(data.username)

    if (userExists && !(userExists.deletedAt)) {
      throw new ValidationError("Insira outro nome de usuário");
    }

    const hashedPassoword = await this.hasher.hash(data.password)

    if (hashedPassoword === data.password) throw new InternalServerError("Ocorreu um erro interno, favor contatar o suporte")

    const formatedDate = this.dateFormat(data.birthDate)

    const user = await this.repository.create({
      name: this.sanitize.sanitizeName(data.name),
      username: this.sanitize.sanitizeUsername(data.username),
      password: hashedPassoword,
      birthDate: formatedDate
    })

    return {
      id: user.id,
      birthDate: user.birthDate,
      name: user.name,
      username: user.username,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      role: user.role
    }


  }

  async findById(authUser: AuthUserDTO, id: string): Promise<UserResponseDTO | null> {
    this.ownership.validateOwnership(authUser, id)

    const user: User | null = await this.repository.findById(id);
    if (!user) return null;

    return this.mapResponse(user)
  }

async findByUsername(authUser: AuthUserDTO, username: string): Promise<UserResponseDTO | null> {

  const user = await this.repository.findByUsername(username);
  if (!user) return null;


  //não uso ownership.validateOwnership aqui para evitar falha de segurança
  if (authUser.role !== "ADMIN" && authUser.id !== user.id) {
    return null;
  }

  return this.mapResponse(user);
}

  async update(authUser: AuthUserDTO, id: string, data: UpdateUserDTO): Promise<UserResponseDTO> {
    const user: UserResponseDTO | null = await this.findById(authUser, id);

    //validações
    if (!user) throw new NotFoundError("Usuário não encontrado");

    //não válido owner aqui pois findById já faz isso
  

    if (data.username) {

      const userExists = await this.repository.findByUsername(data.username)

      if (userExists && !(userExists.deletedAt)) {
        throw new ValidationError("Insira outro nome de usuário");
      }
    }

    if (data.birthDate) {
      //transforma o birthDate em date, sempre virá como string, pois é validado no middlware.
      data.birthDate = this.dateFormat(data.birthDate);
    }

    const updateUser: UpdateUserDTO = {
      name: data.name ? this.sanitize.sanitizeName(data.name) : user.name,
      birthDate: data.birthDate ?? user.birthDate,
      username: data.username ? this.sanitize.sanitizeUsername(data.username) : user.username
    };

    const upadatedUser = await this.repository.update(id, updateUser);

    return this.mapResponse(upadatedUser)
  }

  async softDelete(authUser: AuthUserDTO, id: string): Promise<void> {
    return this.transaction.execute(async (repositories) => {
      const user = await repositories.userRepository.findById(id);

    if (!user) throw new NotFoundError("usuario não encontrado");

    this.ownership.validateOwnership(authUser, user.id)

    await repositories.goalRepository.deleteAllByUserId(user.id)
    await repositories.courseRepository.softDeleteAllByUserId(user.id)
    await repositories.userRepository.softDelete(id);
    await repositories.sessionRepository.invalidateAllByUserId(user.id)
    return;
    })
  }

  private extractDate(date: string): [number, number, number] {
    const parts = date.split("/");

    if (parts.length !== 3) {
      throw new ValidationError("Data inválida!");
    }
    const day = parseInt(parts[0]!, 10);
    const month = parseInt(parts[1]!, 10) - 1;
    const year = parseInt(parts[2]!, 10);

    if ([day, month, year].some(Number.isNaN)) {
      throw new ValidationError("Data inválida!");
    }

    return [day, month, year];
  }

  private dateFormat(date: string | Date): Date {
    if (!(typeof date === "string")) throw new ValidationError(" data inválida")

    const [day, month, year] = this.extractDate(date);

    const formatedDate = new Date(Date.UTC(year, month, day, 0, 0, 0));

    if (
      formatedDate.getUTCFullYear() !== year ||
      formatedDate.getUTCMonth() !== month ||
      formatedDate.getUTCDate() !== day
    ) {
      throw new ValidationError("Data inválida!");
    }

    if (!this.isValidBirthDate(formatedDate))
      throw new ValidationError("Data de nascimento maior que a data atual");

    return formatedDate
  }

  private getCurrentDate(): Date {
    const now = new Date();
    return new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
    );
  }

  private isValidBirthDate(date: Date): boolean {
    return date.getTime() <= this.getCurrentDate().getTime();
  }

  private mapResponse(user: User): UserResponseDTO {
    return {
      id: user.id,
      name: user.name,
      username: user.username,
      role: user.role,
      birthDate: user.birthDate,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
};
    }
}