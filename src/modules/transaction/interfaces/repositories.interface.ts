import type { ICourseRepository } from "../../courses/interfaces/repository/course-repository.interface"
import type { IModuleRepository } from "../../modules/interfaces/repositories/module-repository.interface"
import type { ISessionRepository } from "../../sessions/interfaces/repositories/session-repository.interface"
import type { IUserRepository } from "../../users/interfaces/user-repository.interface"

export interface IRepositories {
  courseRepository: ICourseRepository
  moduleRepository: IModuleRepository
  userRepository: IUserRepository,
  sessionRepository: ISessionRepository
}