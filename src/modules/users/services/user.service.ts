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
import type { IDateConvert } from "../../../shared/convert/interfaces/date-convert.interface";
import type { ListUsersQueryDTO } from "../DTOs/list-users-query.dto";
import type { PaginatedUsersDTO } from "../DTOs/paginated-users.dto";
import type { UserRole } from "../types/user-role.type";
import { ForbiddenError } from "../../../shared/errors/forbidden.error";

export class UserService implements IUserService {
  constructor(
    private repository: IUserRepository,
    private hasher: IHashProvider,
    private sanitize: Isanitize,
    private transaction: ITransaction,
    private readonly ownership: IOwnershipService,
    private readonly dateUtils: IDateConvert
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

    const userExists = await this.repository.findByUsername(this.sanitize.sanitizeUsername(data.username))

    if (userExists && !(userExists.deletedAt)) {
      throw new ValidationError("Insira outro nome de usuário");
    }

    const email = this.normalizeEmail(data.email)

    const emailExists = await this.repository.findByEmail(email)

    if (emailExists && !(emailExists.deletedAt)) {
      throw new ValidationError("Este e-mail já está em uso");
    }

    const hashedPassoword = await this.hasher.hash(data.password)

    if (hashedPassoword === data.password) throw new InternalServerError("Ocorreu um erro interno, favor contatar o suporte")

    const formatedDate = this.dateUtils.dateFormat(data.birthDate)

    if(!this.isValidBirthDate(formatedDate)) throw new ValidationError("Data de nascimento maior que a data atual") 


    const user = await this.repository.create({
      name: this.sanitize.sanitizeName(data.name),
      username: this.sanitize.sanitizeUsername(data.username),
      email,
      password: hashedPassoword,
      birthDate: formatedDate
    })

    return {
      id: user.id,
      birthDate: user.birthDate,
      name: user.name,
      username: user.username,
      email: user.email,
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

    const user = await this.repository.findByUsername(this.sanitize.sanitizeUsername(username));
    if (!user) return null;

    // retorna null (404) em vez de 403 para não revelar quais nomes de usuário existem
    if (authUser.role !== "ADMIN" && authUser.id !== user.id) {
      return null;
    }

    return this.mapResponse(user);
  }

  async update(authUser: AuthUserDTO, id: string, data: UpdateUserDTO): Promise<UserResponseDTO> {
    const user: UserResponseDTO | null = await this.findById(authUser, id);

    if (!user) throw new NotFoundError("Usuário não encontrado");



    if (data.username) {

      const userExists = await this.repository.findByUsername(this.sanitize.sanitizeUsername(data.username))

      if (userExists && !(userExists.deletedAt) && userExists.id !== id) {
        throw new ValidationError("Insira outro nome de usuário");
      }
    }

    if (data.email) {
      const emailExists = await this.repository.findByEmail(this.normalizeEmail(data.email))

      if (emailExists && !(emailExists.deletedAt) && emailExists.id !== id) {
        throw new ValidationError("Este e-mail já está em uso");
      }
    }

    if (data.birthDate) {
      data.birthDate = this.dateUtils.dateFormat(data.birthDate);

      if(!this.isValidBirthDate(data.birthDate)) throw new ValidationError('Data de nascimento maior que a data atual')
    }

    const updateUser: UpdateUserDTO = {
      name: data.name ? this.sanitize.sanitizeName(data.name) : user.name,
      birthDate: data.birthDate ?? user.birthDate,
      username: data.username ? this.sanitize.sanitizeUsername(data.username) : user.username,
      email: data.email ? this.normalizeEmail(data.email) : user.email
    };

    const upadatedUser = await this.repository.update(id, updateUser);

    return this.mapResponse(upadatedUser)
  }

  async softDelete(authUser: AuthUserDTO, id: string): Promise<void> {
    return this.transaction.execute(async (repositories) => {
      const user = await repositories.userRepository.findById(id);

      if (!user) throw new NotFoundError("usuario não encontrado");

      this.ownership.validateOwnership(authUser, user.id)

      await repositories.studySessionRepository.deleteAllByUserId(user.id)
      await repositories.goalRepository.deleteAllByUserId(user.id)
      await repositories.scopedContentRepository.cleanupByUserId(user.id)
      await repositories.courseRepository.softDeleteAllByUserId(user.id)
      await repositories.userRepository.softDelete(id);
      await repositories.sessionRepository.invalidateAllByUserId(user.id)
      return;
    })
  }

  async getMe(authUser: AuthUserDTO): Promise<UserResponseDTO> {
    const user = await this.repository.findById(authUser.id)
    if (!user) throw new NotFoundError("Usuário não encontrado")
    return this.mapResponse(user)
  }

  async list(authUser: AuthUserDTO, query: ListUsersQueryDTO): Promise<PaginatedUsersDTO<UserResponseDTO>> {
    if (authUser.role !== "ADMIN") throw new ForbiddenError("Apenas administradores podem listar usuários")

    const page = query.page ?? 1
    const pageSize = query.pageSize ?? 20
    const { items, total } = await this.repository.findMany({ ...query, page, pageSize })

    return { items: items.map(user => this.mapResponse(user)), total, page, pageSize }
  }

  async updateRole(authUser: AuthUserDTO, id: string, role: UserRole): Promise<UserResponseDTO> {
    if (authUser.role !== "ADMIN") throw new ForbiddenError("Apenas administradores podem alterar perfis")
    if (authUser.id === id) throw new ValidationError("Você não pode alterar o seu próprio perfil de acesso")

    const user = await this.repository.findById(id)
    if (!user) throw new NotFoundError("Usuário não encontrado")

    const updated = await this.repository.updateRole(id, role)
    return this.mapResponse(updated)
  }

  private normalizeEmail(email: string): string {
    return email.trim().toLowerCase()
  }

  private  isValidBirthDate(date: Date): boolean {
        return date.getTime() <= this.dateUtils.getCurrentDate().getTime();
    }


  private mapResponse(user: User): UserResponseDTO {
    return {
      id: user.id,
      name: user.name,
      username: user.username,
      email: user.email,
      role: user.role,
      birthDate: user.birthDate,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    };
  }
}