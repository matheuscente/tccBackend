import type { Course, PrismaClient } from "@prisma/client";
import type { CreateCourseDTO } from "../DTOs/create-course.DTO";
import type { ICouseRepository } from "../interfaces/repository/course-repository.interface";

export class CourseRepository implements ICouseRepository {

    constructor(
        private readonly orm: PrismaClient
    ) {}

    create(data: CreateCourseDTO): Promise<Course> {

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

    update(courseId: string, data: Partial<Omit<CreateCourseDTO, "userId">>): Promise<Course> {
        return this.orm.course.update({
            where: {
                id: courseId
            },
             data
        })
    }

    async softDelete(courseId: string): Promise<void> {
        await this.orm.course.updateMany({
            where: {
                id: courseId,
                deletedAt: null
            },
            data: {
                deletedAt: new Date()
            }
        })
    }
    
}