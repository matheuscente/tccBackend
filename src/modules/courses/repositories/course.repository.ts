import type { Course, PrismaClient } from "@prisma/client";
import type { CreateCourseDTO } from "../DTOs/create-course.DTO";
import type { ICouseRepository } from "../interfaces/repository/course-repository.interface";
import type { CreateCourseRepositoryDTO } from "../DTOs/create-course-repository.DTO";

export class CourseRepository implements ICouseRepository {

    constructor(
        private readonly orm: PrismaClient
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
    
}