import type { Goal } from "@prisma/client";
import type { AuthUserDTO } from "../../../shared/DTOs/auth-user.DTO";
import type { IOwnershipService } from "../../../shared/ownership/ownership-service.interface";
import type { Isanitize } from "../../../shared/sanitize/interfaces/sanitize.interface";
import type { CreateGoalDTO } from "../DTOs/create-goal.DTO";
import type { ResponseGoalDTO } from "../DTOs/response-goal.DTO";
import type { UpdateGoalDTO } from "../DTOs/update-goal.DTO";
import type { IGoalRepository } from "../interfaces/repositories/goal-respository.interface";
import type { IGoalService } from "../interfaces/services/goal-service.interface";
import { NotFoundError } from "../../../shared/errors/not-found-error";
import type { ICourseRepository } from "../../courses/interfaces/repositories/course-repository.interface";
import type { IModuleRepository } from "../../modules/interfaces/repositories/module-repository.interface";
import type { IDisciplineRepository } from "../../disciplines/interfaces/repositories/discipline-repository.interface";
import { ValidationError } from "../../../shared/errors/validation-error";
import { AuthorizationError } from "../../../shared/errors/authorization.error";

export class GoalService implements IGoalService {
    constructor(
        private readonly goalRepository: IGoalRepository,
        private readonly sanitize: Isanitize,
        private readonly ownership: IOwnershipService,
        private readonly courseRepository: ICourseRepository,
        private readonly disciplineRepository: IDisciplineRepository,
        private readonly moduleRepository: IModuleRepository,

    ) { }

    async create(authUser: AuthUserDTO, data: CreateGoalDTO): Promise<ResponseGoalDTO> {

        //verifica se a data inicial é válida
        const startDate = new Date(data.startDate)
        if (isNaN(startDate.getTime())) throw new ValidationError("Data inicial inválida")

        //verifica se a data final é válida e se é maior que a data inicial
        const endDate = data.endDate ? new Date(data.endDate) : null

        this.validateEndDate(endDate, startDate)

        if (data.targetMinutes <= 0) {
            throw new ValidationError("targetMinutes deve ser maior que zero");
        }

        const scopes = [data.courseId, data.moduleId, data.disciplineId].filter(Boolean)
        if (scopes.length > 1) throw new ValidationError("Meta pode ter apenas um escopo")

        const ownerId = await this.ownership.resolveOwnerId(authUser, data.userId);

        if (data.courseId) {
            const parent = await this.courseRepository.findOwnedById(data.courseId, ownerId)
            if (!parent) throw new NotFoundError("Curso não encontrado")

        } else if (data.moduleId) {
            const parent = await this.moduleRepository.findByIdWithCourse(data.moduleId)
            if (!parent) throw new NotFoundError("Módulo não encontrado")
            if (parent.course.userId !== ownerId) throw new AuthorizationError("Ação não autorizada")

        } else if (data.disciplineId) {
            const parent = await this.disciplineRepository.findByIdWithCourse(data.disciplineId)
            if (!parent) throw new NotFoundError("Disciplina não encontrada")
            if (parent.module.course.userId !== ownerId) throw new AuthorizationError("Ação não autorizada")
        }

        const goal = await this.goalRepository.create({
            moduleId: data.moduleId ?? null,
            courseId: data.courseId ?? null,
            disciplineId: data.disciplineId ?? null,
            title: this.sanitize.sanitizeName(data.title),
            userId: ownerId,
            type: data.type,
            targetMinutes: data.targetMinutes,
            startDate,
            endDate
        });

        return this.mapResponse(goal);
    }

    async findById(authUser: AuthUserDTO, goalId: string): Promise<ResponseGoalDTO | null> {
        const goal = authUser.role === "ADMIN"
            ? await this.goalRepository.findById(goalId)
            : await this.goalRepository.findByIdWithOwner(goalId, authUser.id)

        if (!goal) return null;

        return this.mapResponse(goal);
    }

    async findAllByUserId(authUser: AuthUserDTO, targetUserId: string): Promise<ResponseGoalDTO[]> {
        // Se não for admin, só pode buscar o próprio usuário
        this.ownership.validateOwnership(authUser, targetUserId);

        const goals = await this.goalRepository.findAllByUserId(targetUserId);

        return goals.map((goal) => this.mapResponse(goal));
    }

    async update(authUser: AuthUserDTO, goalId: string, data: UpdateGoalDTO): Promise<ResponseGoalDTO> {
        const goal = authUser.role === "ADMIN"
            ? await this.goalRepository.findById(goalId)
            : await this.goalRepository.findByIdWithOwner(goalId, authUser.id)


        if (!goal) throw new NotFoundError("Meta não encontrada");

        //verifica se a data final é válida e se é maior que a data inicial
        //se undefined, manter valor do banco
        let endDate = goal.endDate;

        if (data.endDate !== undefined) {
            if (data.endDate === null) {
                endDate = null;
            } else {
                const parsed = new Date(data.endDate);

                this.validateEndDate(parsed, goal.startDate);

                endDate = parsed;
            }
        }

        if (data.targetMinutes !== undefined && data.targetMinutes <= 0 ) {
            throw new ValidationError("targetMinutes deve ser maior que zero");
        }

        const updatedGoal = await this.goalRepository.update(goalId, {
            title: data.title ? this.sanitize.sanitizeName(data.title) : goal.title,
            targetMinutes: data.targetMinutes ?? goal.targetMinutes,
            endDate
        });

        return this.mapResponse(updatedGoal);
    }

    async delete(authUser: AuthUserDTO, goalId: string): Promise<void> {
        const goal = authUser.role === "ADMIN"
            ? await this.goalRepository.findById(goalId)
            : await this.goalRepository.findByIdWithOwner(goalId, authUser.id)

        //método Idempotente. Se goal já não existe, retorna null
        if (!goal) return;

        await this.goalRepository.delete(goalId);
    }

    private validateEndDate(endDate: Date | null, startDate: Date) {
        if (endDate && isNaN(endDate.getTime())) {
            throw new ValidationError("Data final inválida");
        }
        if (endDate && endDate < startDate) {
            throw new ValidationError("Data final não pode ser menor que a data inicial");
        }
    }

    private mapResponse(goal: Goal): ResponseGoalDTO {
        return {
            id: goal.id,
            moduleId: goal.moduleId,
            courseId: goal.courseId,
            disciplineId: goal.disciplineId,
            title: goal.title,
            createdAt: goal.createdAt.toISOString(),
            updatedAt: goal.updatedAt.toISOString(),
            type: goal.type,
            targetMinutes: goal.targetMinutes,
            startDate: goal.startDate.toISOString(),
            endDate: goal.endDate ? goal.endDate.toISOString() : null


        };
    }

}