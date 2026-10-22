export interface ResponseNoteDTO {
    id: string
    title: string
    content: string
    courseId: string | null
    moduleId: string | null
    disciplineId: string | null
    createdAt: string
    updatedAt: string
}
