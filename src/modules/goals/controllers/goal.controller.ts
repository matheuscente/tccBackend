import type { Request, Response, NextFunction } from "express";
import type { CreateGoalDTO } from "../DTOs/create-goal.DTO";
import type { UpdateGoalDTO } from "../DTOs/update-goal.DTO";
import type { IGoalController } from "../interfaces/controllers/goal-controller.interface";
import type { IGoalService } from "../interfaces/services/goal-service.interface";
import { AuthorizationError } from "../../../shared/errors/authorization.error";

export class GoalController implements IGoalController {

    constructor(
        private readonly service: IGoalService
    ) {}

    create = async (req: Request<any, any, CreateGoalDTO>, res: Response, next: NextFunction): Promise<void> => {
        try {
            const authUser = req.user
            const data = req.body

            if (!authUser) throw new AuthorizationError("Usuário não autenticado")

            const goal = await this.service.create(authUser, data)

            res.status(201).json({ data: goal })

        } catch (err) {
            next(err)
        }
    }

    findById = async (req: Request<{ id: string }>, res: Response, next: NextFunction): Promise<void> => {
        try {
            const authUser = req.user
            const { id } = req.params

            if (!authUser) throw new AuthorizationError("Usuário não autenticado")

            const goal = await this.service.findById(authUser, id)

            if (!goal) {
                res.status(204).send()
                return
            }

            res.status(200).json({ data: goal })

        } catch (err) {
            next(err)
        }
    }

    findAllByUserId = async (req: Request<{ userId: string }>, res: Response, next: NextFunction): Promise<void> => {
        try {
            const authUser = req.user
            const { userId } = req.params

            if (!authUser) throw new AuthorizationError("Usuário não autenticado")

            const goals = await this.service.findAllByUserId(authUser, userId)

            if (goals.length === 0) {
                res.status(204).send()
                return
            }

            res.status(200).json({ data: goals })

        } catch (err) {
            next(err)
        }
    }

    update = async (req: Request<{ id: string }, any, UpdateGoalDTO>, res: Response, next: NextFunction): Promise<void> => {
        try {
            const authUser = req.user
            const { id } = req.params
            const data = req.body

            if (!authUser) throw new AuthorizationError("Usuário não autenticado")

            const updatedGoal = await this.service.update(authUser, id, data)

            res.status(200).json({ data: updatedGoal })

        } catch (err) {
            next(err)
        }
    }

    delete = async (req: Request<{ id: string }>, res: Response, next: NextFunction): Promise<void> => {
        try {
            const authUser = req.user
            const { id } = req.params

            if (!authUser) throw new AuthorizationError("Usuário não autenticado")

            await this.service.delete(authUser, id)

            res.status(204).send()

        } catch (err) {
            next(err)
        }
    }

}