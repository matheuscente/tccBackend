import type { CourseResponseDTO } from "../DTOs/course-response.DTO";
import type { CreateCourseDTO } from "../DTOs/create-course.DTO";
import type { ICouseRepository } from "../interfaces/repository/course-repository.interface";
import type { ICourseService } from "../interfaces/services/courses-service-interface";

export class CourseService implements ICourseService{
    constructor (
        private readonly courseRepository: ICouseRepository
    ) {}
    async create(data: CreateCourseDTO): Promise<CourseResponseDTO> {
        throw new Error("Method not implemented.");
    }
    async findById(courseId: string): Promise<CourseResponseDTO | null> {
        throw new Error("Method not implemented.");
    }
    async findAllByUserId(userId: string): Promise<CourseResponseDTO[]> {
        throw new Error("Method not implemented.");
    }
    async update(courseId: string, data: Partial<Omit<CreateCourseDTO, "userId">>): Promise<CourseResponseDTO> {
        throw new Error("Method not implemented.");
    }
    async softDelete(courseId: string): Promise<void> {
        throw new Error("Method not implemented.");
    }


    
}