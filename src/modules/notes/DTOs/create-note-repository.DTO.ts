export interface CreateNoteRepositoryDTO {
    userId: string
    title: string
    content: string
    position: number | null
    courseId: string | null
    moduleId: string | null
    disciplineId: string | null
}
