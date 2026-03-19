import type { Request, Response, NextFunction } from "express";
import type { IUserController } from "../interfaces/user-controller.interface";
import type { IUserService } from "../interfaces/user-service.interface";
import type { UpdateUserDTO } from "../DTOs/update-user.dto";
import type { CreateUserDTO } from "../DTOs/create-user.dto";
import { AuthorizationError } from "../../../shared/errors/authorization.error";

export class UserController implements IUserController {
    constructor(private readonly service: IUserService) {}

    create = async (req: Request<any, any, CreateUserDTO>, res: Response, next: NextFunction): Promise<void> => {
        try {
            const user = req.body

            const createdUser = await this.service.create(user)

            res.status(201).json({ data: createdUser })

        } catch (err) {
            next(err)
        }
    }

    findById = async (req: Request<{ id: string }>, res: Response, next: NextFunction): Promise<void> => {
        try {
            const authUser = req.user
            const { id } = req.params

            if (!authUser) throw new AuthorizationError("Usuário não autenticado")

            const user = await this.service.findById(authUser, id)

            if (!user) {
                res.status(204).send()
                return
            }

            res.status(200).json({ data: user })

        } catch (err) {
            next(err)
        }
    }

    findByUsername = async (req: Request<{ username: string }>, res: Response, next: NextFunction): Promise<void> => {
        try {
            const authUser = req.user
            const { username } = req.params

            if (!authUser) throw new AuthorizationError("Usuário não autenticado")

            const user = await this.service.findByUsername(authUser, username)

            if (!user) {
                res.status(204).send()
                return
            }

            res.status(200).json({ data: user })

        } catch (err) {
            next(err)
        }
    }

    update = async (req: Request<{ id: string }, any, UpdateUserDTO>, res: Response, next: NextFunction): Promise<void> => {
        try {
            const authUser = req.user
            const { id } = req.params
            const data = req.body

            if (!authUser) throw new AuthorizationError("Usuário não autenticado")

            const user = await this.service.update(authUser, id, data)

            res.status(200).json({ data: user })

        } catch (err) {
            next(err)
        }
    }

    updatePassword = async (req: Request<{ id: string }, any, { oldPassword: string, newPassword: string }>, res: Response, next: NextFunction): Promise<void> => {
        try {
            const authUser = req.user
            const { id } = req.params
            const { oldPassword, newPassword } = req.body

            if (!authUser) throw new AuthorizationError("Usuário não autenticado")

            await this.service.updatePassword(authUser, id, oldPassword, newPassword)

            res.status(204).send()

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