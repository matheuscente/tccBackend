export interface ResponseActivityDTO {
    id: string
    title: string
    description: string | null
    courseId: string | null
    moduleId: string | null
    disciplineId: string | null
    questionCount: number
    attemptCount: number
    bestScore: number | null
    lastScore: number | null
    lastAttemptAt: string | null
    createdAt: string
    updatedAt: string
}
