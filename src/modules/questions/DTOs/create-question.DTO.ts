import type { QuestionType } from "@prisma/client"

export interface QuestionOptionInputDTO {
    text: string
    isCorrect: boolean
}

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

export interface UpdateQuestionDTO {
    statement?: string
    explanation?: string | null
    options?: QuestionOptionInputDTO[]
}
