export interface CreateNoteDTO {
    title: string
    content?: string
    userId?: string
    courseId?: string | null
    moduleId?: string | null
    disciplineId?: string | null
}
