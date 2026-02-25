import type { Course } from "@prisma/client";
import type { CreateCourseRepositoryDTO } from "../../DTOs/create-course-repository.DTO";

export interface ICourseRepository {
    
    create(data: CreateCourseRepositoryDTO): Promise<Course>

    findById(courseId: string): Promise<Course | null>

    findOwnedById(courseId: string, userId: string): Promise<Course | null>

    findAllByUserId(userId: string): Promise<Course[]>

    update(courseId: string, data: Partial<Omit<CreateCourseRepositoryDTO, "userId">>): Promise<Course>

    softDelete(courseId: string, userId: string): Promise<void>

}