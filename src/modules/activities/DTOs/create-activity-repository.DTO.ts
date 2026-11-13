export interface CreateActivityRepositoryDTO {
    userId: string
    title: string
    description: string | null
    courseId: string | null
    moduleId: string | null
    disciplineId: string | null
}
