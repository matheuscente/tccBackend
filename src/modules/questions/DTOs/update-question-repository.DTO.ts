import type { QuestionOptionRepositoryDTO } from "./question-option-repository.DTO"

export interface UpdateQuestionRepositoryDTO {
    statement?: string
    explanation?: string | null
    options?: QuestionOptionRepositoryDTO[]
}
