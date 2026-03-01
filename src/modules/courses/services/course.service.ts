import type { Course, User } from "@prisma/client";
import { NotFoundError } from "../../../shared/errors/not-found-error";
import { AuthorizationError } from "../../../shared/errors/authorization.error";
import type { Isanitize } from "../../../shared/sanitize/interfaces/sanitize.interface";
import type { CourseResponseDTO } from "../DTOs/course-response.DTO";
import type { CreateCourseDTO } from "../DTOs/create-course.DTO";
import type { ICourseRepository } from "../interfaces/repository/course-repository.interface";
import type { ICourseService } from "../interfaces/services/courses-service-interface";
import type { AuthUserDTO } from "../DTOs/auth-user.DTO";
import type { IUserRepository } from "../../users/interfaces/user-repository.interface";
import type { ITransaction } from "../../transaction/interfaces/transaction.interface";

export class CourseService implements ICourseService {
  constructor(
    private readonly courseRepository: ICourseRepository,
    private readonly userRepository: IUserRepository,
    private readonly sanitize: Isanitize,
    private readonly transaction: ITransaction
  ) {}

  async create(
    authUser: AuthUserDTO,
    data: CreateCourseDTO,
  ): Promise<CourseResponseDTO> {

    const ownerId = await this.resolveOwnerId(authUser, data.userId)

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
    this.validateOwnership(authUser, targetUserId);

    const courses = await this.courseRepository.findAllByUserId(targetUserId);

    if (courses.length === 0) return [];

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
    this.validateOwnership(authUser, course.userId);

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

    this.validateOwnership(authUser, course.userId);

    await repositories.moduleRepository.softDeleteAllByCourseId([courseId])

    await repositories.courseRepository.softDelete(courseId, course.userId);
    })
  }

  private validateOwnership(
    user: Pick<User, "id" | "role">,
    ownerId: string,
  ): void {
    if (user.role !== "ADMIN" && user.id !== ownerId) {
      throw new AuthorizationError("Ação não autorizada");
    }
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

  private async resolveOwnerId(
  authUser: AuthUserDTO,
  userId?: string
): Promise<string> {
  if (authUser.role === "ADMIN") {
    if (userId && userId !== authUser.id) {
      const userExists = await this.userRepository.findById(userId);
      if (!userExists) {
        throw new NotFoundError("Usuário não encontrado");
      }
      return userId;
    }
    return authUser.id;
  }

  if (userId && userId !== authUser.id) {
    throw new AuthorizationError("Ação não autorizada");
  }

  return authUser.id;
}
}
