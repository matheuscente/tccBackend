import type { Request, Response, NextFunction } from "express";
import type { CreateCourseDTO } from "../DTOs/create-course.DTO";
import type { ICourseController } from "../interfaces/controllers/course-controller.interface";
import type { ICourseService } from "../interfaces/services/courses-service-interface";
import { AuthorizationError } from "../../../shared/errors/authorization.error";
import { NotFoundError } from "../../../shared/errors/not-found-error";

export class CourseController implements ICourseController {

    constructor(
        private readonly service: ICourseService
    ) {}

    create = async (req: Request<any, any, CreateCourseDTO>, res: Response, next: NextFunction): Promise<void> => {
        try {
            const authUser = req.user
            const course = req.body

            if(!authUser) throw new AuthorizationError("Usuário não autenticado")

            const createdCourse = await this.service.create(authUser, course)

            res.status(201).json({data: createdCourse})

        } catch(err) {
            next(err)
        }
    }

    findById = async (req: Request<{ id: string; }>, res: Response, next: NextFunction): Promise<void> => {
        try {
            const authUser = req.user
            const { id } = req.params

            if(!authUser) throw new AuthorizationError("Usuário não autenticado")

            const course = await this.service.findById(authUser, id)

            if(!course) {
                res.status(204).send()
                return
            }

            res.status(200).json({data: course})

        } catch(err) {
            next(err)
        }
    }

    findAllByUserId = async (req: Request<any, any, any, { userId: string; }>, res: Response, next: NextFunction): Promise<void> => {
       try {
            const authUser = req.user
            const { userId } = req.query

            if(!authUser) throw new AuthorizationError("Usuário não autenticado")

            const courses = await this.service.findAllByUserId(authUser, userId)

            if(courses.length === 0) {
                res.status(204).send()
                return
            }

            res.status(200).json({data: courses})

        } catch(err) {
            next(err)
        }
    }

    update = async (req: Request<{ id: string; }, any, Partial<Omit<CreateCourseDTO, "userId">>>, res: Response, next: NextFunction): Promise<void> => {
        try {
            const authUser = req.user
            const { id } = req.params
            const course = req.body

            if(!authUser) throw new AuthorizationError("Usuário não autenticado")

            const updatedCourse = await this.service.update(authUser, id, course)

            res.status(200).json({data: updatedCourse})

        } catch(err) {
            next(err)
        }
    }

    softDelete = async (req: Request<{ id: string; }>, res: Response, next: NextFunction): Promise<void> => {
       try {
            const authUser = req.user
            const { id } = req.params

            if(!authUser) throw new AuthorizationError("Usuário não autenticado")

            await this.service.softDelete(authUser, id)

            res.status(204).send()

        } catch(err) {
            next(err)
        }
    }

    
}