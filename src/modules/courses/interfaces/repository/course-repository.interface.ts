import type { Course } from "@prisma/client";
import type { CreateCourseDTO } from "../../DTOs/create-course.DTO";

export interface ICouseRepository {
    
    create(data: CreateCourseDTO): Promise<Course>

    findById(courseId: string): Promise<Course | null>

    findAllByUserId(userId: string): Promise<Course[]>

    update(courseId: string, data: Partial<Omit<CreateCourseDTO, "userId">>): Promise<Course>

    softDelete(courseId: string): Promise<void>

}