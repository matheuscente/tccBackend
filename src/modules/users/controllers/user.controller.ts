import type { Request, Response, NextFunction } from "express";
import type { IUserController } from "../interfaces/user-controller.interface";
import type { IUserService } from "../interfaces/user-service.interface";
import { NotFoundError } from "../../../shared/errors/not-found-error";
import type { UpdateUserDTO } from "../DTOs/update-user.dto";
import type { CreateUserDTO } from "../DTOs/create-user.dto";

export class UserController implements IUserController {
    constructor(private readonly service: IUserService) {}

    create = async (req: Request<any, any, CreateUserDTO>, res: Response, next: NextFunction): Promise<void>  => {
        
        try {

            const user = req.body

            const createdUser = await this.service.create(user)

            res.status(201).json({data: createdUser})


        } catch(err) {
            console.log(err)
            next(err)

        }

    }

    findById = async (req: Request<any, any, any, { id: string; }>, res: Response, next: NextFunction): Promise<void> => {
       try {

        const { id } = req.query

        const user = await this.service.findById(id)

        if(!user) throw new NotFoundError("Usuário não encontrado")

        res.status(200).json({data: user})

       } catch (err) {

        next(err)

       }
    }

     findByUsername = async (req: Request<any, any, any, { username: string; }>, res: Response, next: NextFunction): Promise<void> => {
       try {

        const { username } = req.query

        const user = await this.service.findByUsername(username)

        if(!user) throw new NotFoundError("Usuário não encontrado")

        res.status(200).json({data: user})

       } catch (err) {

        next(err)

       }
    
    }

   softDelete = async (req: Request<any, any, any, { id: string; }>, res: Response, next: NextFunction): Promise<void> => {
        
        try {
            const { id } = req.query

            await this.service.softDelete(id)

            res.status(204).send()

        } catch(err) {

            next(err)

        }
    }
    update = async (req: Request<any, any, UpdateUserDTO, { id: string}>, res: Response, next: NextFunction): Promise<void> => {

         try {

            const { id } = req.query
            const data = req.body

            const user = await this.service.update(id, data)

            res.status(200).json({data: user})

        } catch(err) {

            next(err)
            
        }
    }
    
    updatePassword = async (req: Request<any, any, { oldPassword: string, newPassword: string}, { id: string }>, res: Response, next: NextFunction): Promise<void> => {
        
        try {

            const { id } = req.query
            const { oldPassword, newPassword } = req.body

            await this.service.updatePassword(id, oldPassword, newPassword)

            res.status(204).send()

        } catch(err) {

            next(err)
            
        }
        
    }
   
}