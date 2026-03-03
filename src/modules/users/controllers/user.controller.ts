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

    findById = async (req: Request<{id: string}>, res: Response, next: NextFunction): Promise<void> => {
       try {

        const { id } = req.params

        const user = await this.service.findById(id)

        if(!user) {
            res.status(204).send()
            return
        }

        res.status(200).json({data: user})

       } catch (err) {

        console.log(err)
        next(err)

       }
    }

     findByUsername = async (req: Request<{username: string}>, res: Response, next: NextFunction): Promise<void> => {
       try {

        const { username } = req.params

        const user = await this.service.findByUsername(username)

        if(!user) {
            res.status(204).send()
            return
        }

        res.status(200).json({data: user})

       } catch (err) {

        console.log(err)
        next(err)

       }
    
    }

   softDelete = async (req: Request<{ id: string }, any, any>, res: Response, next: NextFunction): Promise<void> => {
        
        try {
            const { id } = req.params

                    console.log("id controller", id)

            await this.service.softDelete(id)

            res.status(204).send()

        } catch(err) {

            console.log(err)
            next(err)

        }
    }
    update = async (req: Request<{ id: string}, any, UpdateUserDTO>, res: Response, next: NextFunction): Promise<void> => {

         try {

            const { id } = req.params
            const data = req.body

            const user = await this.service.update(id, data)

            res.status(200).json({data: user})

        } catch(err) {

            console.log(err)
            next(err)
            
        }
    }
    
    updatePassword = async (req: Request<{ id: string }, any, { oldPassword: string, newPassword: string}>, res: Response, next: NextFunction): Promise<void> => {
        
        try {

            const { id } = req.params
            const { oldPassword, newPassword } = req.body

            await this.service.updatePassword(id, oldPassword, newPassword)

            res.status(204).send()

        } catch(err) {

            console.log(err)
            next(err)
            
        }
        
    }
   
}