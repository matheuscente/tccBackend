import type { QuestionType } from "@prisma/client"

export interface ResponseQuestionOptionDTO {
    id: string
    text: string
    order: number
    isCorrect?: boolean
}

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
