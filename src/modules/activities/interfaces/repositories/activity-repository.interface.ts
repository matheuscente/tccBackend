import type { Activity, ActivityAttempt } from "@prisma/client"
import type { ActivityWithQuestionsDTO, ActivityWithStatsDTO, AttemptWithAnswersDTO, CreateActivityRepositoryDTO, CreateAttemptRepositoryDTO } from "../../DTOs/activity.DTO"

export interface IActivityRepository {
    create(data: CreateActivityRepositoryDTO): Promise<Activity>
    findById(activityId: string): Promise<Activity | null>
    findByIdWithQuestions(activityId: string): Promise<ActivityWithQuestionsDTO | null>
    findAllByUserId(userId: string): Promise<ActivityWithStatsDTO[]>
    findByIdWithStats(activityId: string): Promise<ActivityWithStatsDTO | null>
    update(activityId: string, data: Partial<Omit<CreateActivityRepositoryDTO, "userId">>): Promise<Activity>
    setQuestions(activityId: string, questionIds: string[]): Promise<void>
    softDelete(activityId: string): Promise<void>
    createAttempt(data: CreateAttemptRepositoryDTO): Promise<ActivityAttempt>
    findAttemptById(attemptId: string): Promise<AttemptWithAnswersDTO | null>
    findAttemptsByActivityId(activityId: string): Promise<(ActivityAttempt & { activity: { id: string, title: string } })[]>
    findAttemptsByUserId(userId: string, since?: Date): Promise<(ActivityAttempt & { activity: { id: string, title: string, courseId: string | null, moduleId: string | null, disciplineId: string | null } })[]>
}
