import type { Activity, Question, QuestionOption } from "@prisma/client"

export interface ActivityWithQuestionsDTO extends Activity {
    questions: {
        order: number
        question: Question & { options: QuestionOption[] }
    }[]
}
