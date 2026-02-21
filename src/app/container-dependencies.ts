import { prisma } from "../lib/prisma"
import { authenticationMiddleware } from "../middlewares/authentication/authentication.middleware"
import { AuthController } from "../modules/auth/controllers/auth-controller"
import { AccessTokenService } from "../modules/auth/services/access-token/access-token.service"
import { AuthService } from "../modules/auth/services/auth/auth.service"
import { SessionRepository } from "../modules/sessions/repositories/session.repository"
import { SessionService } from "../modules/sessions/services/session.service"
import { UserController } from "../modules/users/controllers/user.controller"
import { UserRepository } from "../modules/users/repositories/user.repository"
import { UserService } from "../modules/users/services/user.service"
import { DateConvert } from "../shared/convert/utils/date-convert.utils"
import { HashProvider } from "../shared/hash/provider/hash.provider"
import { SanitizeUtils } from "../shared/sanitize/utils/sanitize.utils"

class AppContainer {
     // shared singletons
  hashProvider = new HashProvider(10)
  sanitizeUtils = new SanitizeUtils()
  dateConvert = new DateConvert()
  accessTokenService = new AccessTokenService("test")

  // repositories
  userRepository = new UserRepository(prisma)
  sessionRepository = new SessionRepository(prisma)

  // services

    sessionService = new SessionService(
    this.sessionRepository,
    this.hashProvider
  )
  
  userService = new UserService(
    this.userRepository,
    this.hashProvider,
    this.sanitizeUtils,
    this.sessionService
  )
  authService = new AuthService(
    this.userRepository,
    this.sessionService,
    this.hashProvider,
    this.dateConvert,
    this.accessTokenService
  )

  //middlewares
  authenticationMiddleware = authenticationMiddleware(
    this.accessTokenService,
    this.sessionService
  )

  // controllers
  userController = new UserController(this.userService)
  authController = new AuthController(this.authService)
} 

export const container = new AppContainer()