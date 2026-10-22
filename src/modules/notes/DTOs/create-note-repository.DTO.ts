export interface CreateNoteRepositoryDTO {
    userId: string
    title: string
    content: string
    courseId: string | null
    moduleId: string | null
    disciplineId: string | null
}
