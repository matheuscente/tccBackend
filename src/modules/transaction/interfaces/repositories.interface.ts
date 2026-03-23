import type { ICourseRepository } from "../../courses/interfaces/repositories/course-repository.interface"
import type { IDisciplineRepository } from "../../disciplines/interfaces/repositories/discipline-repository.interface"
import type { IGoalRepository } from "../../goals/interfaces/repositories/goal-respository.interface"
import type { IModuleRepository } from "../../modules/interfaces/repositories/module-repository.interface"
import type { ISessionRepository } from "../../sessions/interfaces/repositories/session-repository.interface"
import type { IStudySessionRepository } from "../../study-sessions/interfaces/repositories/study-session-repository.interface"
import type { IUserRepository } from "../../users/interfaces/user-repository.interface"

export interface IRepositories {
  courseRepository: ICourseRepository
  moduleRepository: IModuleRepository
  userRepository: IUserRepository,
  sessionRepository: ISessionRepository,
  disciplineRepository: IDisciplineRepository,
  goalRepository: IGoalRepository,
  studySessionRepository: IStudySessionRepository
}