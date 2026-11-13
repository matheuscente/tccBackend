import type { Activity, ActivityAttempt, Prisma, PrismaClient } from "@prisma/client";
import type { IActivityRepository } from "../interfaces/repositories/activity-repository.interface";
import type { ActivityWithQuestionsDTO } from "../DTOs/activity-with-questions.DTO";
import type { ActivityWithStatsDTO } from "../DTOs/activity-with-stats.DTO";
import type { AttemptWithActivityDTO } from "../DTOs/attempt-with-activity.DTO";
import type { AttemptWithActivityScopeDTO } from "../DTOs/attempt-with-activity-scope.DTO";
import type { AttemptWithAnswersDTO } from "../DTOs/attempt-with-answers.DTO";
import type { CreateActivityRepositoryDTO } from "../DTOs/create-activity-repository.DTO";
import type { CreateAttemptRepositoryDTO } from "../DTOs/create-attempt-repository.DTO";
import type { UpdateActivityRepositoryDTO } from "../DTOs/update-activity-repository.DTO";

const statsInclude = {
    _count: { select: { questions: { where: { question: { deletedAt: null } } }, attempts: true } },
    attempts: { select: { score: true, finishedAt: true }, orderBy: { finishedAt: "desc" } }
} as const

export class ActivityRepository implements IActivityRepository {
    constructor(private readonly orm: PrismaClient | Prisma.TransactionClient) { }

    create(data: CreateActivityRepositoryDTO): Promise<Activity> {
        return this.orm.activity.create({ data })
    }

    findById(activityId: string): Promise<Activity | null> {
        return this.orm.activity.findFirst({ where: { id: activityId, deletedAt: null } })
    }

    findByIdWithQuestions(activityId: string): Promise<ActivityWithQuestionsDTO | null> {
        return this.orm.activity.findFirst({
            where: { id: activityId, deletedAt: null },
            include: {
                questions: {
                    where: { question: { deletedAt: null } },
                    orderBy: { order: "asc" },
                    include: { question: { include: { options: { orderBy: { order: "asc" } } } } }
                }
            }
        })
    }

    findAllByUserId(userId: string): Promise<ActivityWithStatsDTO[]> {
        return this.orm.activity.findMany({
            where: { userId, deletedAt: null },
            include: statsInclude,
            orderBy: { createdAt: "desc" }
        })
    }

    findByIdWithStats(activityId: string): Promise<ActivityWithStatsDTO | null> {
        return this.orm.activity.findFirst({
            where: { id: activityId, deletedAt: null },
            include: statsInclude
        })
    }

    update(activityId: string, data: UpdateActivityRepositoryDTO): Promise<Activity> {
        return this.orm.activity.update({ where: { id: activityId }, data })
    }

    async setQuestions(activityId: string, questionIds: string[]): Promise<void> {
        await this.orm.activityQuestion.deleteMany({ where: { activityId } })

        if (questionIds.length === 0) return

        await this.orm.activityQuestion.createMany({
            data: questionIds.map((questionId, order) => ({ activityId, questionId, order }))
        })
    }

    async softDelete(activityId: string): Promise<void> {
        await this.orm.activity.updateMany({
            where: { id: activityId, deletedAt: null },
            data: { deletedAt: new Date() }
        })
    }

    createAttempt(data: CreateAttemptRepositoryDTO): Promise<ActivityAttempt> {
        const { answers, ...attempt } = data

        return this.orm.activityAttempt.create({
            data: {
                ...attempt,
                answers: { create: answers }
            }
        })
    }

    findAttemptById(attemptId: string): Promise<AttemptWithAnswersDTO | null> {
        return this.orm.activityAttempt.findUnique({
            where: { id: attemptId },
            include: {
                activity: { select: { id: true, title: true } },
                answers: {
                    include: { question: { include: { options: { orderBy: { order: "asc" } } } } }
                }
            }
        })
    }

    findAttemptsByActivityId(activityId: string): Promise<AttemptWithActivityDTO[]> {
        return this.orm.activityAttempt.findMany({
            where: { activityId },
            include: { activity: { select: { id: true, title: true } } },
            orderBy: { finishedAt: "desc" }
        })
    }

    findAttemptsByUserId(userId: string, since?: Date): Promise<AttemptWithActivityScopeDTO[]> {
        return this.orm.activityAttempt.findMany({
            where: {
                userId,
                activity: { deletedAt: null },
                ...(since ? { finishedAt: { gte: since } } : {})
            },
            include: {
                activity: {
                    select: { id: true, title: true, courseId: true, moduleId: true, disciplineId: true }
                }
            },
            orderBy: { finishedAt: "asc" }
        })
    }
}
