import type { AttemptAnswerRepositoryDTO } from "./attempt-answer-repository.DTO"

export interface CreateAttemptRepositoryDTO {
    activityId: string
    userId: string
    correctCount: number
    totalQuestions: number
    score: number
    startedAt: Date
    answers: AttemptAnswerRepositoryDTO[]
}
