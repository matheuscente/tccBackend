import type { Question, QuestionOption } from "@prisma/client"

export interface QuestionWithOptionsDTO extends Question {
    options: QuestionOption[]
}

export interface QuestionScopeFilterDTO {
    courseId?: string
    moduleId?: string
    disciplineId?: string
    search?: string
}
