import type { Activity, ActivityAttempt } from "@prisma/client"
import type { ActivityWithQuestionsDTO } from "../../DTOs/activity-with-questions.DTO"
import type { ActivityWithStatsDTO } from "../../DTOs/activity-with-stats.DTO"
import type { AttemptWithActivityDTO } from "../../DTOs/attempt-with-activity.DTO"
import type { AttemptWithActivityScopeDTO } from "../../DTOs/attempt-with-activity-scope.DTO"
import type { AttemptWithAnswersDTO } from "../../DTOs/attempt-with-answers.DTO"
import type { CreateActivityRepositoryDTO } from "../../DTOs/create-activity-repository.DTO"
import type { CreateAttemptRepositoryDTO } from "../../DTOs/create-attempt-repository.DTO"
import type { UpdateActivityRepositoryDTO } from "../../DTOs/update-activity-repository.DTO"

export interface IActivityRepository {
    create(data: CreateActivityRepositoryDTO): Promise<Activity>
    findById(activityId: string): Promise<Activity | null>
    findByIdWithQuestions(activityId: string): Promise<ActivityWithQuestionsDTO | null>
    findAllByUserId(userId: string): Promise<ActivityWithStatsDTO[]>
    findByIdWithStats(activityId: string): Promise<ActivityWithStatsDTO | null>
    update(activityId: string, data: UpdateActivityRepositoryDTO): Promise<Activity>
    setQuestions(activityId: string, questionIds: string[]): Promise<void>
    softDelete(activityId: string): Promise<void>
    createAttempt(data: CreateAttemptRepositoryDTO): Promise<ActivityAttempt>
    findAttemptById(attemptId: string): Promise<AttemptWithAnswersDTO | null>
    findAttemptsByActivityId(activityId: string): Promise<AttemptWithActivityDTO[]>
    findAttemptsByUserId(userId: string, since?: Date): Promise<AttemptWithActivityScopeDTO[]>
}
