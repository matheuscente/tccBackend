import type { Question, QuestionOption } from "@prisma/client"

export interface QuestionWithOptionsDTO extends Question {
    options: QuestionOption[]
}
