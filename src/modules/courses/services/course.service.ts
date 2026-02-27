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

export class CourseService implements ICourseService {
  constructor(
    private readonly courseRepository: ICourseRepository,
    private readonly userRepository: IUserRepository,
    private readonly sanitize: Isanitize,
  ) {}

  async create(
    authUser: AuthUserDTO,
    data: CreateCourseDTO,
  ): Promise<CourseResponseDTO> {
    let ownerId: string;

    
    if (authUser.role === "ADMIN") {
        if (data.userId) {
            const userExists = await this.userRepository.findById(data.userId);

            if (!userExists) {
                throw new NotFoundError("Usuário não encontrado");
            }
        
        // ja que data.userId existe, atribuimos ele em ownerId
        ownerId = data.userId;
      } else {
        //como não existe data.userId, deduzimos que o admin deseja alterar um curso prórpio
        ownerId = authUser.id;
      }


    } else {
        //se role nao for admin, atribuimos automaticamente o id do usuario autenticado
        ownerId = authUser.id;
    }

    

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
  targetUserId: string
): Promise<CourseResponseDTO[]>  {

    // Se não for admin, só pode buscar o próprio usuário
    this.validateOwnership(authUser, targetUserId)

    const courses = await this.courseRepository.findAllByUserId(targetUserId);

    if (courses.length === 0) return [];

    return courses.map(course => this.mapResponse(course));
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

    const course = await this.courseRepository.findById(courseId);

    if (!course) return;

    this.validateOwnership(authUser, course.userId);

    await this.courseRepository.softDelete(courseId, course.userId);
  }

  private validateOwnership(user: Pick<User, "id" | "role">, ownerId: string): void {
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

}
