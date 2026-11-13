import type { QuestionType } from "@prisma/client"
import type { QuestionOptionInputDTO } from "./question-option-input.DTO"

export interface CreateQuestionDTO {
    statement: string
    type: QuestionType
    explanation?: string | null
    userId?: string
    courseId?: string | null
    moduleId?: string | null
    disciplineId?: string | null
    options: QuestionOptionInputDTO[]
}
