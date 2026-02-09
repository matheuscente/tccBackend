import express from "express"
import { RequestValidator } from "../../../middlewares/data-validator.middleware"
import { FindUserByIdSchema } from "../../../shared/schemas/find-by-id.schema.ts"
import { userFactory } from "../factory/user.factory"
import { FindUserByUsernameSchema } from "../validators/find-by-username.schema"
import { CreateUserSchema } from "../validators/create-user.schema"
import { UpdateUserSchema } from "../validators/update-user.schema"
import { UpdateUserPasswordSchema } from "../validators/update-password.schema"

export const userRoutes = express.Router()

const userController = userFactory()

userRoutes.get('/id', RequestValidator.queryValidator(FindUserByIdSchema), userController.findById)

userRoutes.get('/username', RequestValidator.queryValidator(FindUserByUsernameSchema), userController.findByUsername)

userRoutes.post('/', RequestValidator.bodyValidator(CreateUserSchema), userController.create)

userRoutes.patch('/:username', RequestValidator.paramsValidator(FindUserByUsernameSchema), RequestValidator.bodyValidator(UpdateUserSchema), userController.update)

userRoutes.patch('/:username/password', RequestValidator.paramsValidator(FindUserByUsernameSchema), RequestValidator.bodyValidator(UpdateUserPasswordSchema), userController.updatePassword)

userRoutes.delete('/:username', RequestValidator.paramsValidator(FindUserByUsernameSchema), userController.softDelete)