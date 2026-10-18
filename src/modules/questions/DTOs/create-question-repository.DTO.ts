import type { QuestionType } from "@prisma/client"

export interface CreateQuestionRepositoryDTO {
    userId: string
    statement: string
    type: QuestionType
    explanation: string | null
    courseId: string | null
    moduleId: string | null
    disciplineId: string | null
    options: { text: string, isCorrect: boolean, order: number }[]
}

export interface UpdateQuestionRepositoryDTO {
    statement?: string
    explanation?: string | null
    options?: { text: string, isCorrect: boolean, order: number }[]
}
