import { ForbiddenError } from "../errors/forbidden.error";
import { AuthorizationError } from "../errors/authorization.error";
import { NotFoundError } from "../errors/not-found-error";
import { ValidationError } from "../errors/validation-error";
import type { ICourseRepository } from "../../modules/courses/interfaces/repositories/course-repository.interface";
import type { IModuleRepository } from "../../modules/modules/interfaces/repositories/module-repository.interface";
import type { IDisciplineRepository } from "../../modules/disciplines/interfaces/repositories/discipline-repository.interface";
import type { IScopeService } from "./scope-service.interface";
import type { ScopeFieldsDTO, ScopeInputDTO, ScopePathDTO } from "./scope.DTO";

export class ScopeService implements IScopeService {
    constructor(
        private readonly courseRepository: ICourseRepository,
        private readonly moduleRepository: IModuleRepository,
        private readonly disciplineRepository: IDisciplineRepository
    ) { }

    normalize(scope: ScopeInputDTO, required = false): ScopeFieldsDTO {
        const informed = [scope.courseId, scope.moduleId, scope.disciplineId].filter(Boolean)

        if (informed.length > 1) throw new ValidationError("Informe apenas um escopo: curso, módulo ou disciplina")
        if (required && informed.length === 0) throw new ValidationError("Informe um escopo: curso, módulo ou disciplina")

        return {
            courseId: scope.courseId ?? null,
            moduleId: scope.moduleId ?? null,
            disciplineId: scope.disciplineId ?? null
        }
    }

    async resolveOwned(scope: ScopeInputDTO, ownerId: string): Promise<ScopePathDTO | null> {
        const fields = this.normalize(scope)

        if (fields.courseId) {
            const course = await this.courseRepository.findById(fields.courseId)
            if (!course) throw new NotFoundError("Curso não encontrado")
            this.checkOwner(course.userId, ownerId)
            return { courseId: course.id, moduleId: null, disciplineId: null, ownerId: course.userId }
        }

        if (fields.moduleId) {
            const module = await this.moduleRepository.findByIdWithCourse(fields.moduleId)
            if (!module) throw new NotFoundError("Módulo não encontrado")
            this.checkOwner(module.course.userId, ownerId)
            return { courseId: module.courseId, moduleId: module.id, disciplineId: null, ownerId: module.course.userId }
        }

        if (fields.disciplineId) {
            const discipline = await this.disciplineRepository.findByIdWithCourse(fields.disciplineId)
            if (!discipline) throw new NotFoundError("Disciplina não encontrada")
            this.checkOwner(discipline.module.course.userId, ownerId)
            const module = await this.moduleRepository.findById(discipline.moduleId)
            if (!module) throw new NotFoundError("Módulo não encontrado")
            return {
                courseId: module.courseId,
                moduleId: discipline.moduleId,
                disciplineId: discipline.id,
                ownerId: discipline.module.course.userId
            }
        }

        return null
    }

    isWithin(inner: ScopePathDTO, outer: ScopeFieldsDTO): boolean {
        if (outer.disciplineId) return inner.disciplineId === outer.disciplineId
        if (outer.moduleId) return inner.moduleId === outer.moduleId
        if (outer.courseId) return inner.courseId === outer.courseId
        return true
    }

    private checkOwner(resourceOwnerId: string, ownerId: string) {
        if (resourceOwnerId !== ownerId) throw new ForbiddenError("Ação não autorizada")
    }
}
