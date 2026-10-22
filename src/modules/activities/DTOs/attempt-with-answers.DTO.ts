import type { AttemptAnswer, Question, QuestionOption } from "@prisma/client"
import type { AttemptWithActivityDTO } from "./attempt-with-activity.DTO"

export interface AttemptWithAnswersDTO extends AttemptWithActivityDTO {
    answers: (AttemptAnswer & {
        question: Question & { options: QuestionOption[] }
    })[]
}
