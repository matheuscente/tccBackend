import type { PrismaClient } from "@prisma/client"
import type { ITransaction } from "../interfaces/transaction.interface"
import type { IRepositories } from "../interfaces/repositories.interface"
import { ModuleRepository } from "../../modules/repositories/module.repository"
import { CourseRepository } from "../../courses/repositories/course.repository"
import { UserRepository } from "../../users/repositories/user.repository"
import { SessionRepository } from "../../sessions/repositories/session.repository"

export class Trasanction implements ITransaction {
  constructor(private readonly prisma: PrismaClient) {}

  async execute<T>(work: (repositories: IRepositories) => Promise<T>): Promise<T> {
    return this.prisma.$transaction(async (tx) => {

      const moduleRepository = new ModuleRepository(tx)
      const courseRepository = new CourseRepository(tx, moduleRepository)
      const userRepository = new UserRepository(tx)
      const sessionRepository = new SessionRepository(tx)

      const repositories: IRepositories = {
        moduleRepository,
        courseRepository,
        userRepository,
        sessionRepository
      }

      return work(repositories)
    })
  }
}