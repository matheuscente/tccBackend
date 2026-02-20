import express from "express"
import { RequestValidator } from "../../../middlewares/data-validator.middleware"


export const authRoutes = express.Router()

//const authController = authFactory()



//authRoutes.post('/login', RequestValidator.bodyValidator(), authController.create)

//authRoutes.post('/refresh', authController.updatePassword)

//authRoutes.delete('/logout', authController.softDelete)