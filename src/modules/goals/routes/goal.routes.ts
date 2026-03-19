import express from "express"
import { RequestValidator } from "../../../middlewares/data-validator.middleware"
import { container } from "../../../app/container-dependencies"
import { createGoalSchema } from "../validators/create-goal.schema"
import { updateGoalSchema } from "../validators/update-goal.schema"
import { FindByIdSchema } from "../../../shared/schemas/find-by-id.schema"
import { findAllByUserIdGoalSchema } from "../validators/findAllByUserId-goal.schema"


export const goalRoutes = express.Router()

const goalController = container.goalController
const authentication = container.authenticationMiddleware

goalRoutes.get('/id/:id', RequestValidator.paramsValidator(FindByIdSchema), authentication, goalController.findById)

goalRoutes.get('/user/:userId', RequestValidator.queryValidator(findAllByUserIdGoalSchema), authentication, goalController.findAllByUserId)

goalRoutes.post('/', RequestValidator.bodyValidator(createGoalSchema), authentication, goalController.create)

goalRoutes.patch('/:id', RequestValidator.paramsValidator(FindByIdSchema), RequestValidator.bodyValidator(updateGoalSchema), authentication, goalController.update)

goalRoutes.delete('/:id', RequestValidator.paramsValidator(FindByIdSchema), authentication, goalController.delete)