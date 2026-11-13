import type { QuestionOptionInputDTO } from "./question-option-input.DTO"

export interface UpdateQuestionDTO {
    statement?: string
    explanation?: string | null
    options?: QuestionOptionInputDTO[]
}
