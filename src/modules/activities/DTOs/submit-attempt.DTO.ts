import type { SubmitAttemptAnswerDTO } from "./submit-attempt-answer.DTO"

export interface SubmitAttemptDTO {
    startedAt?: string
    answers: SubmitAttemptAnswerDTO[]
}
