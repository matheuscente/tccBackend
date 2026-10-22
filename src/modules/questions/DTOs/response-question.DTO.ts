import type { QuestionType } from "@prisma/client"
import type { ResponseQuestionOptionDTO } from "./response-question-option.DTO"

export interface ResponseQuestionDTO {
    id: string
    statement: string
    type: QuestionType
    explanation: string | null
    courseId: string | null
    moduleId: string | null
    disciplineId: string | null
    options: ResponseQuestionOptionDTO[]
    createdAt: string
    updatedAt: string
}
