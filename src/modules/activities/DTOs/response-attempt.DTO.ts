import type { ResponseAttemptAnswerDTO } from "./response-attempt-answer.DTO"

export interface ResponseAttemptDTO {
    id: string
    activityId: string
    activityTitle: string
    correctCount: number
    totalQuestions: number
    score: number
    startedAt: string
    finishedAt: string
    durationSeconds: number
    answers?: ResponseAttemptAnswerDTO[]
}
