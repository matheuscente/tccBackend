export interface CreateActivityDTO {
    title: string
    description?: string | null
    userId?: string
    courseId?: string | null
    moduleId?: string | null
    disciplineId?: string | null
    questionIds?: string[]
}
