import type { QuestionType } from "@prisma/client"
import type { QuestionOptionRepositoryDTO } from "./question-option-repository.DTO"

export interface CreateQuestionRepositoryDTO {
    userId: string
    statement: string
    type: QuestionType
    explanation: string | null
    courseId: string | null
    moduleId: string | null
    disciplineId: string | null
    options: QuestionOptionRepositoryDTO[]
}
