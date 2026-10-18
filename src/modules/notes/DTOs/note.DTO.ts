export interface CreateNoteDTO {
    title: string
    content?: string
    userId?: string
    courseId?: string | null
    moduleId?: string | null
    disciplineId?: string | null
}

export interface UpdateNoteDTO {
    title?: string
    content?: string
    courseId?: string | null
    moduleId?: string | null
    disciplineId?: string | null
}

export interface CreateNoteRepositoryDTO {
    userId: string
    title: string
    content: string
    courseId: string | null
    moduleId: string | null
    disciplineId: string | null
}

export interface NoteFilterDTO {
    courseId?: string
    moduleId?: string
    disciplineId?: string
    search?: string
}

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
