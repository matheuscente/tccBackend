import { Prisma, PrismaClient, type User } from "@prisma/client";
import type { CreateUserDTO } from "../DTOs/create-user.dto";
import type { UpdateUserDTO } from "../DTOs/update-user.dto";
import type { IUserRepository } from "../interfaces/user-repository.interface";
import type { DatabaseInterface } from "../../../database/database.interface";
import { createUser, deleteUser, getUserById, getUserByUserame, getUserPassword, updateUserData, updateUserPassword } from "../querys/userQuerys";
import type { UserResponseDTO } from "../DTOs/user-response.dto";
import { InternalServerError } from "../../../shared/errors/internal-server-error";
import type { UserResponseWithPasswordDTO } from "../DTOs/user-response-password.DTO";
import { userResponseMap } from "../utils/userResponseMap";

export class UserRepository implements IUserRepository {
  constructor(private orm: DatabaseInterface) {}

  async updatePassword(userId: string, newPassword: string): Promise<void> {
    const cypher = updateUserPassword
    await this.orm.execute(cypher, {userId, password: newPassword})
  }

  async create(data: CreateUserDTO): Promise<UserResponseDTO> {
    const cypher = createUser
    const result = await this.orm.execute(cypher, {...data})
    const newUserData = result.records[0]?.get("user")
    if(!newUserData) throw new InternalServerError("Ocorreu um erro interno. Por favor, tente novamente")
    return userResponseMap(newUserData)
  }

  async findById(id: string): Promise<UserResponseDTO | null> {
    const cypher = getUserById
    const result = await this.orm.execute(cypher, {id})
    const data = result.records[0]?.get("user") ?? null
    return data ? userResponseMap(data): null
  }

  async findByUsername(username: string): Promise<UserResponseDTO | null> {
    const cypher = getUserByUserame
    const result = await this.orm.execute(cypher, {username})
    const data = result.records[0]?.get("user") ?? null
    return data ? userResponseMap(data): null
  }

  async update(id: string, data: UpdateUserDTO): Promise<UserResponseDTO> {
    const cypher = updateUserData
    const result = await this.orm.execute(cypher, {...data, id})
    const newUserData = result.records[0]?.get("user")
    if(!newUserData) throw new InternalServerError("Ocorreu um erro interno. Por favor, tente novamente")
    return userResponseMap(newUserData)
  }

  async softDelete(id: string): Promise<void> {
    const cypher = deleteUser
    await this.orm.execute(cypher, {id})
  }

  async getUserWithPassword(username: string): Promise<UserResponseWithPasswordDTO | null> {
    const cypher = getUserPassword
    const result = await this.orm.execute(cypher, {username})
    const data = result.records[0]?.get("user") ?? null
    return data ? {
      id: data.id,
      username: data.username,
      password: data.password
    } : null
  }
}
