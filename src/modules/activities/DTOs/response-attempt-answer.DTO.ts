export interface ResponseAttemptAnswerDTO {
    questionId: string
    statement: string
    explanation: string | null
    selectedOptionId: string | null
    correctOptionId: string | null
    isCorrect: boolean
    options: { id: string, text: string }[]
}
