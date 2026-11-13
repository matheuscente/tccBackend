import type { Course, Prisma, PrismaClient } from "@prisma/client";
import type { ICourseRepository } from "../interfaces/repositories/course-repository.interface";
import type { CreateCourseRepositoryDTO } from "../DTOs/create-course-repository.DTO";
import type { IModuleRepository } from "../../modules/interfaces/repositories/module-repository.interface";

export class CourseRepository implements ICourseRepository {

    constructor(
        private readonly orm: PrismaClient | Prisma.TransactionClient,
        private readonly moduleRepository: IModuleRepository

    ) {}

    create(data: CreateCourseRepositoryDTO): Promise<Course> {

        return this.orm.course.create({
            data
        })
    }

    findById(courseId: string): Promise<Course | null> {
        return this.orm.course.findFirst({
            where: {
                id: courseId,
                deletedAt: null
            }
        })
    }

    async findOwnedById(courseId: string, userId: string): Promise<Course | null> {
        return this.orm.course.findFirst({
            where: {
                id: courseId,
                userId,
                deletedAt: null
            }
        })
    }


    findAllByUserId(userId: string): Promise<Course[]> {
       return this.orm.course.findMany({
            where: {
                userId,
                deletedAt: null
            },
            orderBy: {
                createdAt: "desc"
            }
        })
    }

    update(courseId: string, data: Partial<Omit<CreateCourseRepositoryDTO, "userId">>): Promise<Course> {
        return this.orm.course.update({
            where: {
                id: courseId,
            },
             data
        })
    }

    async softDelete(courseId: string, userId: string): Promise<void> {
        
        await this.orm.course.updateMany({
            where: {
                id: courseId,
                userId,
                deletedAt: null
            },
            data: {
                deletedAt: new Date()
            }
        })
    }

    async softDeleteAllByUserId(userId: string): Promise<void> {
        const courses = await this.findAllByUserId(userId)

        const coursesId = courses.map(course => course.id)

        await this.moduleRepository.softDeleteAllByCourseIds(coursesId)

        await this.orm.course.updateMany({
            where: {
                userId,
                deletedAt: null
            },
            data: {
                deletedAt: new Date()
            }
        })
    }

}