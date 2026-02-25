import type { AuthUserDTO } from "../../DTOs/auth-user.DTO";
import type { CourseResponseDTO } from "../../DTOs/course-response.DTO";
import type { CreateCourseDTO } from "../../DTOs/create-course.DTO";

export interface ICourseService {
  create(
    authUser: AuthUserDTO,
    data: CreateCourseDTO,
  ): Promise<CourseResponseDTO>;

  findById(
    authUser: AuthUserDTO,
    courseId: string,
  ): Promise<CourseResponseDTO | null>;

  findAllByUserId(
    authUser: AuthUserDTO,
    userId: string,
  ): Promise<CourseResponseDTO[]>;

  update(
    authUser: AuthUserDTO,
    courseId: string,
    data: Partial<Omit<CreateCourseDTO, "userId">>,
  ): Promise<CourseResponseDTO>;

  softDelete(authUser: AuthUserDTO, courseId: string): Promise<void>;
}
