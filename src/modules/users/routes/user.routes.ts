import express from "express"
import { RequestValidator } from "../../../middlewares/data-validator.middleware"
import { FindByIdSchema } from "../../../shared/schemas/find-by-id.schema"
import { container } from "../../../app/container-dependencies"
import { FindUserByUsernameSchema } from "../validators/find-by-username.schema"
import { CreateUserSchema } from "../validators/create-user.schema"
import { UpdateUserSchema } from "../validators/update-user.schema"
import { UpdateUserPasswordSchema } from "../validators/update-password.schema"
import { ListUsersSchema } from "../validators/list-users.schema"
import { UpdateRoleSchema } from "../validators/update-role.schema"
import { requireRole } from "../../../middlewares/authorization/authorization.middleware"

export const userRoutes = express.Router()

const userController = container.userController
const authentication = container.authenticationMiddleware

userRoutes.get('/me', authentication, userController.me)

userRoutes.get('/', RequestValidator.queryValidator(ListUsersSchema), authentication, requireRole("ADMIN"), userController.list)

userRoutes.get('/id/:id', RequestValidator.paramsValidator(FindByIdSchema), authentication, userController.findById)

userRoutes.get('/username/:username', RequestValidator.paramsValidator(FindUserByUsernameSchema), authentication, userController.findByUsername)

userRoutes.post('/', RequestValidator.bodyValidator(CreateUserSchema), userController.create)

userRoutes.patch('/:id/role', RequestValidator.paramsValidator(FindByIdSchema), RequestValidator.bodyValidator(UpdateRoleSchema), authentication, requireRole("ADMIN"), userController.updateRole)

userRoutes.patch('/:id', RequestValidator.paramsValidator(FindByIdSchema), RequestValidator.bodyValidator(UpdateUserSchema), authentication, userController.update)

userRoutes.patch('/:id/password', RequestValidator.paramsValidator(FindByIdSchema), RequestValidator.bodyValidator(UpdateUserPasswordSchema), authentication, userController.updatePassword)

userRoutes.delete('/:id', RequestValidator.paramsValidator(FindByIdSchema), authentication, userController.softDelete)
