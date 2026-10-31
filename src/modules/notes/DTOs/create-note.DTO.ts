export interface CreateNoteDTO {
    title: string
    content?: string
    position?: number
    userId?: string
    courseId?: string | null
    moduleId?: string | null
    disciplineId?: string | null
}
