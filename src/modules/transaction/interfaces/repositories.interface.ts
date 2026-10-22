import type { ICourseRepository } from "../../courses/interfaces/repositories/course-repository.interface"
import type { IDisciplineRepository } from "../../disciplines/interfaces/repositories/discipline-repository.interface"
import type { IGoalRepository } from "../../goals/interfaces/repositories/goal-respository.interface"
import type { IModuleRepository } from "../../modules/interfaces/repositories/module-repository.interface"
import type { ISessionRepository } from "../../sessions/interfaces/repositories/session-repository.interface"
import type { IStudySessionRepository } from "../../study-sessions/interfaces/repositories/study-session-repository.interface"
import type { IScopedContentRepository } from "../../scoped-content/interfaces/repositories/scoped-content-repository.interface"
import type { IUserRepository } from "../../users/interfaces/user-repository.interface"
import type { IQuestionRepository } from "../../questions/interfaces/repositories/question-repository.interface"
import type { IActivityRepository } from "../../activities/interfaces/repositories/activity-repository.interface"
import type { ITicketRepository } from "../../tickets/interfaces/repositories/ticket-repository.interface"

export interface IRepositories {
  courseRepository: ICourseRepository
  moduleRepository: IModuleRepository
  userRepository: IUserRepository,
  sessionRepository: ISessionRepository,
  disciplineRepository: IDisciplineRepository,
  goalRepository: IGoalRepository,
  studySessionRepository: IStudySessionRepository,
  scopedContentRepository: IScopedContentRepository,
  questionRepository: IQuestionRepository,
  activityRepository: IActivityRepository,
  ticketRepository: ITicketRepository
}
