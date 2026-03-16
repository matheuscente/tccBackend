import type { Goal } from "@prisma/client"
import type { CreateGoalRepositoryDTO } from "../../DTOs/create-goal-repository.DTO"

export interface IGoalRepository {
    findById(goalId: string): Promise<Goal | null>
    findByIdWithOwner(goalId: string, userId: string): Promise<Goal | null>
    findAllByUserId(userId: string): Promise<Goal[]>
    create(data: CreateGoalRepositoryDTO): Promise<Goal>
    update(goalId: string, data: Partial<CreateGoalRepositoryDTO>): Promise<Goal>
    delete(goalId: string): Promise<void>
    deleteAllByCourseIds(courseIds: string[]): Promise<void>
    deleteAllByModuleIds(moduleIds: string[]): Promise<void>
    deleteAllByDisciplineIds(disciplineIds: string[]): Promise<void>
}