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
import { PrismaClient } from "@prisma/client/extension"
import { ModuleRepository } from "../modules/modules/repositories/module.repository"
import { ModuleController } from "../modules/modules/controllers/module.controller"
import { ModuleService } from "../modules/modules/services/module.service"
import { OwnershipService } from "../shared/ownership/ownership.service"

class AppContainer {
     // shared singletons
  hashProvider = new HashProvider(10)
  sanitizeUtils = new SanitizeUtils()
  dateConvert = new DateConvert()
  accessTokenService = new AccessTokenService("test")
  transaction = new Trasanction(PrismaClient)
  // repositories
  userRepository = new UserRepository(prisma)
  sessionRepository = new SessionRepository(prisma)
  moduleRepository = new ModuleRepository(prisma)
  courseRpository = new CourseRepository(prisma, this.moduleRepository)

  // services
    ownerService = new OwnershipService(this.userRepository)

    sessionService = new SessionService(
    this.sessionRepository,
    this.hashProvider
  )
  
  userService = new UserService(
    this.userRepository,
    this.hashProvider,
    this.sanitizeUtils,
    this.transaction,
    this.ownerService
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
} 

export const container = new AppContainer()