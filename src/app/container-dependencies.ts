import { prisma } from "../lib/prisma"
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

import { env } from "../config/env"
import { ScopeService } from "../shared/scope/scope.service"
import { FileTokenService } from "../shared/file-token/file-token.service"
import { createStorageProvider } from "../shared/storage/storage.factory"
import { ConsoleMailProvider } from "../shared/mail/console-mail.provider"
import { SmtpMailProvider } from "../shared/mail/smtp-mail.provider"
import type { IMailProvider } from "../shared/mail/mail-provider.interface"
import { PasswordResetRepository } from "../modules/auth/repositories/password-reset.repository"
import { PasswordResetService } from "../modules/auth/services/password-reset/password-reset.service"
import { QuestionRepository } from "../modules/questions/repositories/question.repository"
import { QuestionService } from "../modules/questions/services/question.service"
import { QuestionController } from "../modules/questions/controllers/question.controller"
import { ActivityRepository } from "../modules/activities/repositories/activity.repository"
import { ActivityService } from "../modules/activities/services/activity.service"
import { ActivityController } from "../modules/activities/controllers/activity.controller"
import { NoteRepository } from "../modules/notes/repositories/note.repository"
import { NoteService } from "../modules/notes/services/note.service"
import { NoteController } from "../modules/notes/controllers/note.controller"
import { FileRepository } from "../modules/files/repositories/file.repository"
import { FileService } from "../modules/files/services/file.service"
import { FileController } from "../modules/files/controllers/file.controller"
import { TicketRepository } from "../modules/tickets/repositories/ticket.repository"
import { TicketService } from "../modules/tickets/services/ticket.service"
import { TicketController } from "../modules/tickets/controllers/ticket.controller"
import { StatsService } from "../modules/stats/services/stats.service"
import { StatsController } from "../modules/stats/controllers/stats.controller"
import { AdminRepository } from "../modules/admin/repositories/admin.repository"
import { AdminService } from "../modules/admin/services/admin.service"
import { AdminController } from "../modules/admin/controllers/admin.controller"

const createMailProvider = (): IMailProvider => env.smtp.host
  ? new SmtpMailProvider({
      host: env.smtp.host,
      port: env.smtp.port,
      secure: env.smtp.secure,
      user: env.smtp.user,
      pass: env.smtp.pass,
      from: env.smtp.from
    })
  : new ConsoleMailProvider()

class AppContainer {
     // shared singletons
  hashProvider = new HashProvider(10)
  sanitizeUtils = new SanitizeUtils()
  dateConvert = new DateConvert(env.timeZone)
  accessTokenService = new AccessTokenService(env.jwtSecret)
  transaction = new Trasanction(prisma)
  fileTokenService = new FileTokenService(env.fileTokenSecret)
  storageProvider = createStorageProvider()
  mailProvider = createMailProvider()


  // repositories
  userRepository = new UserRepository(prisma)
  sessionRepository = new SessionRepository(prisma)
  moduleRepository = new ModuleRepository(prisma)
  courseRpository = new CourseRepository(prisma, this.moduleRepository)
  disciplineRepository = new DisciplineRepository(prisma)
  goalRepository = new GoalRepository(prisma)
  studySessionRepository = new StudySessionRepository(prisma)
  passwordResetRepository = new PasswordResetRepository(prisma)
  questionRepository = new QuestionRepository(prisma)
  activityRepository = new ActivityRepository(prisma)
  noteRepository = new NoteRepository(prisma)
  fileRepository = new FileRepository(prisma)
  ticketRepository = new TicketRepository(prisma)
  adminRepository = new AdminRepository(prisma)

  // services
    ownerService = new OwnershipService(this.userRepository)

    scopeService = new ScopeService(
    this.courseRpository,
    this.moduleRepository,
    this.disciplineRepository
  )

    sessionService = new SessionService(
    this.sessionRepository,
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
    this.courseRpository,
    this.sanitizeUtils,
    this.transaction,
    this.ownerService
  )

  moduleService = new ModuleService(
    this.moduleRepository,
    this.courseRpository,
    this.sanitizeUtils,
    this.ownerService,
    this.transaction,
  )

  disciplineService = new DisciplineService(
    this.disciplineRepository,
    this.moduleRepository,
    this.sanitizeUtils,
    this.ownerService,
    this.transaction
  )

  goalService = new GoalService(
    this.goalRepository,
    this.sanitizeUtils,
    this.ownerService,
    this.courseRpository,
    this.disciplineRepository,
    this.moduleRepository,
    this.dateConvert
  )

  studySessionService = new StudySessionService(
    this.studySessionRepository,
    this.ownerService,
    this.courseRpository,
    this.disciplineRepository,
    this.moduleRepository,
    this.dateConvert
  )

  passwordResetService = new PasswordResetService(
    this.userRepository,
    this.passwordResetRepository,
    this.sessionService,
    this.hashProvider,
    this.mailProvider,
    env.frontendUrl
  )

  questionService = new QuestionService(this.questionRepository, this.ownerService, this.scopeService)

  activityService = new ActivityService(
    this.activityRepository,
    this.questionRepository,
    this.ownerService,
    this.scopeService
  )

  noteService = new NoteService(this.noteRepository, this.ownerService, this.scopeService)

  fileService = new FileService(
    this.fileRepository,
    this.storageProvider,
    this.ownerService,
    this.scopeService,
    this.fileTokenService,
    env.publicApiUrl
  )

  ticketService = new TicketService(
    this.ticketRepository,
    this.storageProvider,
    this.fileTokenService,
    env.publicApiUrl
  )

  statsService = new StatsService(
    this.studySessionRepository,
    this.ownerService,
    this.dateConvert,
    this.courseRpository,
    this.moduleRepository,
    this.disciplineRepository,
    this.goalRepository,
    this.activityRepository
  )

  adminService = new AdminService(this.adminRepository, this.dateConvert)

  //middlewares
  authenticationMiddleware = authenticationMiddleware(
    this.accessTokenService,
    this.sessionService
  )

  // controllers
  userController = new UserController(this.userService)
  authController = new AuthController(this.authService, this.passwordResetService, env.cookieSecure)
  courseController = new CourseController(this.courseService)
  moduleController = new ModuleController(this.moduleService)
  disciplineController = new DisciplineController(this.disciplineService)
  goalController = new GoalController(this.goalService)
  studySessionController = new StudySessionController(this.studySessionService)
  questionController = new QuestionController(this.questionService)
  activityController = new ActivityController(this.activityService)
  noteController = new NoteController(this.noteService)
  fileController = new FileController(this.fileService, this.storageProvider)
  ticketController = new TicketController(this.ticketService, this.storageProvider)
  statsController = new StatsController(this.statsService)
  adminController = new AdminController(this.adminService)
} 

export const container = new AppContainer()