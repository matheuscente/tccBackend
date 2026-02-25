import type { AuthUserDTO } from "../../DTOs/auth-user.DTO";
import type { CourseResponseDTO } from "../../DTOs/course-response.DTO";
import type { CreateCourseDTO } from "../../DTOs/create-course.DTO";

export interface ICourseService {
  create(userId: string, data: CreateCourseDTO): Promise<CourseResponseDTO>;

  findById(userId: string, courseId: string): Promise<CourseResponseDTO | null>;

  findAllByUserId(
    authenticatedUserId: string,
    targetUserId: string,
  ): Promise<CourseResponseDTO[]>;

  update(
    userId: string,
    courseId: string,
    data: Partial<Omit<CreateCourseDTO, "userId">>,
  ): Promise<CourseResponseDTO>;

  softDelete(userId: string, courseId: string): Promise<void>;
}
