export interface AttemptAnswerRepositoryDTO {
    questionId: string
    selectedOptionId: string | null
    isCorrect: boolean
}
