import type { Course } from "@prisma/client";
import { NotFoundError } from "../../../shared/errors/not-found-error";
import type { Isanitize } from "../../../shared/sanitize/interfaces/sanitize.interface";
import type { CourseResponseDTO } from "../DTOs/course-response.DTO";
import type { CreateCourseDTO } from "../DTOs/create-course.DTO";
import type { ICourseRepository } from "../interfaces/repositories/course-repository.interface";
import type { ICourseService } from "../interfaces/services/courses-service-interface";
import type { AuthUserDTO } from "../../../shared/DTOs/auth-user.DTO"
import type { ITransaction } from "../../transaction/interfaces/transaction.interface";
import type { IOwnershipService } from "../../../shared/ownership/ownership-service.interface";

export class CourseService implements ICourseService {
  constructor(
    private readonly courseRepository: ICourseRepository,
    private readonly sanitize: Isanitize,
    private readonly transaction: ITransaction,
    private readonly ownership: IOwnershipService
  ) { }

  async create(
    authUser: AuthUserDTO,
    data: CreateCourseDTO,
  ): Promise<CourseResponseDTO> {

    const ownerId = await this.ownership.resolveOwnerId(authUser, data.userId)

    const course = await this.courseRepository.create({
      userId: ownerId,
      title: this.sanitize.sanitizeName(data.title),
      description: data.description ?? null,
    });

    return this.mapResponse(course);
  }

  async findById(
    authUser: AuthUserDTO,
    courseId: string,
  ): Promise<CourseResponseDTO | null> {
    const course =
      authUser.role === "ADMIN"
        ? await this.courseRepository.findById(courseId)
        : await this.courseRepository.findOwnedById(courseId, authUser.id);

    if (!course) return null;

    return this.mapResponse(course);
  }

  async findAllByUserId(
    authUser: AuthUserDTO,
    targetUserId: string,
  ): Promise<CourseResponseDTO[]> {
    // Se não for admin, só pode buscar o próprio usuário
    this.ownership.validateOwnership(authUser, targetUserId);

    const courses = await this.courseRepository.findAllByUserId(targetUserId);

    return courses.map((course) => this.mapResponse(course));
  }

  async update(
    authUser: AuthUserDTO,
    courseId: string,
    data: Partial<Omit<CreateCourseDTO, "userId">>,
  ): Promise<CourseResponseDTO> {

    const course = await this.courseRepository.findById(courseId);

    if (!course) {
      throw new NotFoundError("Curso não encontrado");
    }
    this.ownership.validateOwnership(authUser, course.userId);

    const updatedCourse = await this.courseRepository.update(courseId, {
      title: data.title ? this.sanitize.sanitizeName(data.title) : course.title,
      description:
        data.description !== undefined ? data.description : course.description,
    });

    return this.mapResponse(updatedCourse);
  }

  async softDelete(authUser: AuthUserDTO, courseId: string): Promise<void> {
    return this.transaction.execute(async (repositories) => {
      const course = await repositories.courseRepository.findById(courseId);

      if (!course) return;

      this.ownership.validateOwnership(authUser, course.userId);

      await repositories.studySessionRepository.deleteAllByCourseIds([courseId])
      await repositories.moduleRepository.softDeleteAllByCourseIds([courseId])
      await repositories.goalRepository.deleteAllByCourseIds([courseId])
      await repositories.courseRepository.softDelete(courseId, course.userId);
    })
  }

  private mapResponse(course: Course): CourseResponseDTO {
    return {
      id: course.id,
      title: course.title,
      description: course.description,
      createdAt: course.createdAt.toISOString(),
      updatedAt: course.updatedAt.toISOString(),
    };
  }


}