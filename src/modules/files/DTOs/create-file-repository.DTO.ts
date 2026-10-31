export interface CreateFileRepositoryDTO {
    userId: string
    originalName: string
    mimeType: string
    size: number
    storageKey: string
    position: number | null
    courseId: string | null
    moduleId: string | null
    disciplineId: string | null
}
