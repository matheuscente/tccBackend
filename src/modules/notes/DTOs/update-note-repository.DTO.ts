export interface UpdateNoteRepositoryDTO {
    title?: string
    content?: string
    position?: number
    courseId?: string | null
    moduleId?: string | null
    disciplineId?: string | null
}
