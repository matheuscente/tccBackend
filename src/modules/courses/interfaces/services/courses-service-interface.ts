import type { CourseResponseDTO } from "../../DTOs/course-response.DTO"
import type { CreateCourseDTO } from "../../DTOs/create-course.DTO"

export interface ICourseService {
    create(data: CreateCourseDTO): Promise<CourseResponseDTO>
    
        findById(courseId: string): Promise<CourseResponseDTO | null>
    
        findAllByUserId(userId: string): Promise<CourseResponseDTO[]>
    
        update(courseId: string, data: Partial<Omit<CreateCourseDTO, "userId">>): Promise<CourseResponseDTO>
    
        softDelete(courseId: string): Promise<void>
}