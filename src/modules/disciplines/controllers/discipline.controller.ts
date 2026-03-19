import type { Request, Response, NextFunction } from "express";
import type { CreateDisciplineDTO } from "../DTOs/create-discipline.DTO";
import type { IDisciplineController } from "../interfaces/controllers/discipline-controller.interface";
import type { IDisciplineService } from "../interfaces/services/discipline-service.interface";
import { AuthorizationError } from "../../../shared/errors/authorization.error";

export class DisciplineController implements IDisciplineController {

    constructor(
        private readonly service: IDisciplineService
    ) {}

    create = async (req: Request<any, any, CreateDisciplineDTO>, res: Response, next: NextFunction): Promise<void> => {
        try {
            const authUser = req.user
            const data = req.body

            if (!authUser) throw new AuthorizationError("Usuário não autenticado")

            const discipline = await this.service.create(authUser, data)

            res.status(201).json({ data: discipline })

        } catch (err) {
            next(err)
        }
    }

    findById = async (req: Request<{ id: string }>, res: Response, next: NextFunction): Promise<void> => {
        try {
            const authUser = req.user
            const { id } = req.params

            if (!authUser) throw new AuthorizationError("Usuário não autenticado")

            const discipline = await this.service.findById(authUser, id)

            if (!discipline) {
                res.status(204).send()
                return
            }

            res.status(200).json({ data: discipline })

        } catch (err) {
            next(err)
        }
    }

    findAllByModuleId = async (req: Request<{ moduleId: string }>, res: Response, next: NextFunction): Promise<void> => {
        try {
            const authUser = req.user
            const { moduleId } = req.params

            if (!authUser) throw new AuthorizationError("Usuário não autenticado")

            const disciplines = await this.service.findAllByModuleId(authUser, moduleId)

            if (disciplines.length === 0) {
                res.status(204).send()
                return
            }

            res.status(200).json({ data: disciplines })

        } catch (err) {
            next(err)
        }
    }

    findAllByUserId = async (req: Request<{ userId: string }>, res: Response, next: NextFunction): Promise<void> => {
        try {
            const authUser = req.user
            const { userId } = req.params

            if (!authUser) throw new AuthorizationError("Usuário não autenticado")

            const disciplines = await this.service.findAllByUserId(authUser, userId)

            if (disciplines.length === 0) {
                res.status(204).send()
                return
            }

            res.status(200).json({ data: disciplines })

        } catch (err) {
            next(err)
        }
    }

    update = async (req: Request<{ id: string }, any, Partial<CreateDisciplineDTO>>, res: Response, next: NextFunction): Promise<void> => {
        try {
            const authUser = req.user
            const { id } = req.params
            const data = req.body

            if (!authUser) throw new AuthorizationError("Usuário não autenticado")

            const updatedDiscipline = await this.service.update(authUser, id, data)

            res.status(200).json({ data: updatedDiscipline })

        } catch (err) {
            next(err)
        }
    }

    softDelete = async (req: Request<{ id: string }>, res: Response, next: NextFunction): Promise<void> => {
        try {
            const authUser = req.user
            const { id } = req.params

            if (!authUser) throw new AuthorizationError("Usuário não autenticado")

            await this.service.softDelete(authUser, id)

            res.status(204).send()

        } catch (err) {
            next(err)
        }
    }

}