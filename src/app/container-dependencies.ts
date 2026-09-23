import { authenticationMiddleware } from "../middlewares/authentication/authentication.middleware"
import { AuthController } from "../modules/auth/controllers/auth-controller"
import { AccessTokenService } from "../modules/auth/services/access-token/access-token.service"
import { AuthService } from "../modules/auth/services/auth/auth.service"
import { CourseController } from "../modules/courses/controllers/course.controller"
import { CourseRepository } from "../modules/courses/repositories/course.repository"
import { CourseService } from "../modules/courses/services/course.service"
import { SessionRepository } from "../modules/sessions/repositories/session.repository"
import { SessionService } from "../modules/sessions/services/session.service"
import { UserController } from "../modules/users/controllers/user.controller"
import { UserRepository } from "../modules/users/repositories/user.repository"
import { UserService } from "../modules/users/services/user.service"
import { DateConvert } from "../shared/convert/utils/date-convert.utils"
import { HashProvider } from "../shared/hash/provider/hash.provider"
import { SanitizeUtils } from "../shared/sanitize/utils/sanitize.utils"
import { Trasanction } from "../modules/transaction/services/transaction.service"
import { PrismaClient } from "@prisma/client/extension"
import { ModuleRepository } from "../modules/modules/repositories/module.repository"
import { ModuleController } from "../modules/modules/controllers/module.controller"
import { ModuleService } from "../modules/modules/services/module.service"
import { OwnershipService } from "../shared/ownership/ownership.service"
import { DisciplineRepository } from "../modules/disciplines/repositories/discipline.repository"
import { DisciplineService } from "../modules/disciplines/services/discipline.service"
import { DisciplineController } from "../modules/disciplines/controllers/discipline.controller"
import { GoalRepository } from "../modules/goals/repositories/goal.repository"
import { GoalService } from "../modules/goals/services/goal.service"
import { GoalController } from "../modules/goals/controllers/goal.controller"
import { StudySessionService } from "../modules/study-sessions/services/study-session.service"
import { StudySessionRepository } from "../modules/study-sessions/repositories/study-session.repository"
import { StudySessionController } from "../modules/study-sessions/controllers/study-session.controller"
import { database } from "../database/database-config"
import type { IModuleRepository } from "../modules/modules/interfaces/repositories/module-repository.interface"
import type { ISessionRepository } from "../modules/sessions/interfaces/repositories/session-repository.interface"
import type { ICourseRepository } from "../modules/courses/interfaces/repositories/course-repository.interface"
import type { IDisciplineRepository } from "../modules/disciplines/interfaces/repositories/discipline-repository.interface"
import type { IGoalRepository } from "../modules/goals/interfaces/repositories/goal-respository.interface"
import type { IStudySessionRepository } from "../modules/study-sessions/interfaces/repositories/study-session-repository.interface"

class AppContainer {
     // shared singletons
  hashProvider = new HashProvider(10)
  sanitizeUtils = new SanitizeUtils()
  dateConvert = new DateConvert()
  accessTokenService = new AccessTokenService("test")
  transaction = new Trasanction(PrismaClient)


  // repositories
  userRepository = new UserRepository(database)
  sessionRepository = new SessionRepository(database)
  moduleRepository = new ModuleRepository(database)
  courseRpository = new CourseRepository(database, this.moduleRepository as unknown as IModuleRepository)
  disciplineRepository = new DisciplineRepository(database)
  goalRepository = new GoalRepository(database)
  studySessionRepository = new StudySessionRepository(database)

  // services
    ownerService = new OwnershipService(this.userRepository)

    sessionService = new SessionService(
    this.sessionRepository as unknown as ISessionRepository,
    this.hashProvider
  )
  
  userService = new UserService(
    this.userRepository,
    this.hashProvider,
    this.sanitizeUtils,
    this.transaction,
    this.ownerService,
    this.dateConvert
  )
  authService = new AuthService(
    this.userRepository,
    this.sessionService,
    this.hashProvider,
    this.dateConvert,
    this.accessTokenService
  )

  courseService = new CourseService(
    this.courseRpository  as unknown as ICourseRepository,
    this.sanitizeUtils,
    this.transaction,
    this.ownerService
  )

  moduleService = new ModuleService(
    this.moduleRepository  as unknown as IModuleRepository,
    this.courseRpository  as unknown as ICourseRepository,
    this.sanitizeUtils,
    this.ownerService,
    this.transaction,
  )

  disciplineService = new DisciplineService(
    this.disciplineRepository  as unknown as IDisciplineRepository,
    this.moduleRepository as unknown as IModuleRepository,
    this.sanitizeUtils,
    this.ownerService,
    this.transaction
  )

  goalService = new GoalService(
    this.goalRepository as unknown as IGoalRepository,
    this.sanitizeUtils,
    this.ownerService,
    this.courseRpository as unknown as ICourseRepository,
    this.disciplineRepository as unknown as IDisciplineRepository,
    this.moduleRepository as unknown as IModuleRepository,
    this.dateConvert
  )

  studySessionService = new StudySessionService(
    this.studySessionRepository as unknown as IStudySessionRepository,
    this.ownerService,
    this.courseRpository as unknown as ICourseRepository,
    this.disciplineRepository as unknown as IDisciplineRepository,
    this.moduleRepository as unknown as IModuleRepository,
    this.dateConvert
  )

  //middlewares
  authenticationMiddleware = authenticationMiddleware(
    this.accessTokenService,
    this.sessionService
  )

  // controllers
  userController = new UserController(this.userService)
  authController = new AuthController(this.authService)
  courseController = new CourseController(this.courseService)
  moduleController = new ModuleController(this.moduleService)
  disciplineController = new DisciplineController(this.disciplineService)
  goalController = new GoalController(this.goalService)
  studySessionController = new StudySessionController(this.studySessionService)
} 

export const container = new AppContainer()