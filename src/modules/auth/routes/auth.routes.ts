import express from "express"
import { RequestValidator } from "../../../middlewares/data-validator.middleware"
import { container } from "../../../app/container-dependencies"
import { loginAuthSchema } from "../validators/login.schema"


export const authRoutes = express.Router()

const authController = container.authController

authRoutes.post('/login', RequestValidator.bodyValidator(loginAuthSchema), authController.login)

authRoutes.post('/refresh', authController.refreshSession)

authRoutes.delete('/logout', authController.logout)