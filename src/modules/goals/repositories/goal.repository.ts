import type { Goal, Prisma, PrismaClient } from "@prisma/client";
import type { CreateGoalRepositoryDTO } from "../DTOs/create-goal-repository.DTO";
import type { IGoalRepository } from "../interfaces/repositories/goal-respository.interface";
import type { UpdateGoalRepositoryDTO } from "../DTOs/update-goal-repository.DTO";

export class GoalRepository implements IGoalRepository {
    constructor(
        private readonly orm: PrismaClient | Prisma.TransactionClient,
    ) { }

    async findById(goalId: string): Promise<Goal | null> {
        return this.orm.goal.findUnique({
            where: { id: goalId }
        })
    }

    async findByIdWithOwner(goalId: string, userId: string): Promise<Goal | null> {
        return this.orm.goal.findFirst({
            where: { id: goalId, userId }
        })
    }

    async findAllByUserId(userId: string): Promise<Goal[]> {
        return this.orm.goal.findMany({
            where: { userId },
            orderBy: { createdAt: "desc" }
        })
    }

    async create(data: CreateGoalRepositoryDTO): Promise<Goal> {
        return this.orm.goal.create({ data })
    }

    async update(goalId: string, data: UpdateGoalRepositoryDTO): Promise<Goal> {
        return this.orm.goal.update({
            where: { id: goalId },
            data
        })
    }

    async delete(goalId: string): Promise<void> {
        await this.orm.goal.deleteMany({
            where: { id: goalId }
        })
    }

    async deleteAllByCourseIds(courseIds: string[]): Promise<void> {
        await this.orm.goal.deleteMany({
            where: { courseId: { in: courseIds } }
        })
    }

    async deleteAllByModuleIds(moduleIds: string[]): Promise<void> {
        await this.orm.goal.deleteMany({
            where: { moduleId: { in: moduleIds } }
        })
    }

    async deleteAllByDisciplineIds(disciplineIds: string[]): Promise<void> {
        await this.orm.goal.deleteMany({
            where: { disciplineId: { in: disciplineIds } }
        })
    }

    async deleteAllByUserId(userId: string): Promise<void> {
    await this.orm.goal.deleteMany({
        where: { userId }
    })
}

}