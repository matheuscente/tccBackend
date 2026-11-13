import express from "express"
import { RequestValidator } from "../../../middlewares/data-validator.middleware"
import { container } from "../../../app/container-dependencies"
import { loginAuthSchema } from "../validators/login.schema"
import { forgotPasswordSchema } from "../validators/forgot-password.schema"
import { resetPasswordSchema } from "../validators/reset-password.schema"

export const authRoutes = express.Router()

const authController = container.authController
const authentication = container.authenticationMiddleware

authRoutes.post('/login', RequestValidator.bodyValidator(loginAuthSchema), authController.login)

authRoutes.post('/refresh', authController.refreshSession)

authRoutes.delete('/logout', authentication, authController.logout)

authRoutes.post('/forgot-password', RequestValidator.bodyValidator(forgotPasswordSchema), authController.forgotPassword)

authRoutes.post('/reset-password', RequestValidator.bodyValidator(resetPasswordSchema), authController.resetPassword)
