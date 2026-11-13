import { NotFoundError } from "../../../shared/errors/not-found-error";
import { httpSuccessResponse } from "../../../shared/controller/httpSuccessResponse.util";
import type { Request, Response, NextFunction } from "express";
import type { CreateModuleDTO } from "../DTOs/create-module.dto";
import type { IModuleController } from "../interfaces/controllers/module-controller.interface";
import type { IModuleService } from "../interfaces/services/module-service.interface";
import { AuthorizationError } from "../../../shared/errors/authorization.error";

export class ModuleController implements IModuleController {

    constructor(
        private readonly service: IModuleService
    ) {}

    create = async (req: Request<any, any, CreateModuleDTO>, res: Response, next: NextFunction): Promise<void> => {
        try {
            const authUser = req.user
            const data = req.body

            if (!authUser) throw new AuthorizationError("Usuário não autenticado")

            const module = await this.service.create(authUser, data)

            res.status(201).json(httpSuccessResponse(201, module))

        } catch (err) {
            next(err)
        }
    }

    findById = async (req: Request<{ id: string }>, res: Response, next: NextFunction): Promise<void> => {
        try {
            const authUser = req.user
            const { id } = req.params

            if (!authUser) throw new AuthorizationError("Usuário não autenticado")

            const module = await this.service.findById(authUser, id)

            if (!module) throw new NotFoundError("Registro não encontrado")

            res.status(200).json(httpSuccessResponse(200, module))

        } catch (err) {
            next(err)
        }
    }

    findAllByCourseId = async (req: Request<{ courseId: string }>, res: Response, next: NextFunction): Promise<void> => {
        try {
            const authUser = req.user
            const { courseId } = req.params

            if (!authUser) throw new AuthorizationError("Usuário não autenticado")

            const modules = await this.service.findAllByCourseId(authUser, courseId)

            res.status(200).json(httpSuccessResponse(200, modules))

        } catch (err) {
            next(err)
        }
    }

    findAllByUserId = async (req: Request<{ userId: string }>, res: Response, next: NextFunction): Promise<void> => {
        try {
            const authUser = req.user
            const { userId } = req.params

            if (!authUser) throw new AuthorizationError("Usuário não autenticado")

            const modules = await this.service.findAllByUserId(authUser, userId)

            res.status(200).json(httpSuccessResponse(200, modules))

        } catch (err) {
            next(err)
        }
    }

    update = async (req: Request<{ id: string }, any, Partial<CreateModuleDTO>>, res: Response, next: NextFunction): Promise<void> => {
        try {
            const authUser = req.user
            const { id } = req.params
            const data = req.body

            if (!authUser) throw new AuthorizationError("Usuário não autenticado")

            const updatedModule = await this.service.update(authUser, id, data)

            res.status(200).json(httpSuccessResponse(200, updatedModule))

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