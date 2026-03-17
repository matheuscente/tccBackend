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

        const scopes = [data.courseId, data.moduleId, data.disciplineId].filter(Boolean)
        if (scopes.length > 1) throw new ValidationError("Meta pode ter apenas um escopo")

        const ownerId = await this.ownership.resolveOwnerId(authUser, data.userId);

        if (data.courseId) {
            const parent = await this.courseRepository.findById(data.courseId)

            if (!parent) throw new NotFoundError("Curso não encontrado")

        } else if (data.moduleId) {
            const parent = await this.moduleRepository.findByIdWithCourse(data.moduleId)

            if (!parent) throw new NotFoundError("Módulo não encontrado")

        } else if (data.disciplineId) {
            const parent = await this.disciplineRepository.findByIdWithCourse(data.disciplineId)

            if (!parent) throw new NotFoundError("Disciplina não encontrada")
        }

        const goal = await this.goalRepository.create({
            moduleId: data.moduleId ?? null,
            courseId: data.courseId ?? null,
            disciplineId: data.disciplineId ?? null,
            title: this.sanitize.sanitizeName(data.title),
            userId: ownerId,
            type: data.type,
            targetMinutes: data.targetMinutes,
            startDate: new Date(data.startDate),
            endDate: data.endDate ? new Date(data.endDate) : null
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

        return goals.map((goals) => this.mapResponse(goals));
    }

    async update(authUser: AuthUserDTO, goalId: string, data: UpdateGoalDTO): Promise<ResponseGoalDTO> {
        const goal = authUser.role === "ADMIN"
            ? await this.goalRepository.findById(goalId)
            : await this.goalRepository.findByIdWithOwner(goalId, authUser.id)


        if (!goal) throw new NotFoundError("Meta não encontrada");


        const updatedGoal = await this.goalRepository.update(goalId, {
            title: data.title ? this.sanitize.sanitizeName(data.title) : goal.title,
            targetMinutes: data.targetMinutes ?? goal.targetMinutes,

            /*
            se endDate undefined (não informado) mantem a endDate do banco,
             senão
             verifica se endDate é possui valor, se sim atribui data a endDate
             senão
             atribui null
            */
            endDate: data.endDate !== undefined
                ? (data.endDate ? new Date(data.endDate) : null)
                : goal.endDate
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