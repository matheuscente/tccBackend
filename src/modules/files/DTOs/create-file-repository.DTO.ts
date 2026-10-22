export interface CreateFileRepositoryDTO {
    userId: string
    originalName: string
    mimeType: string
    size: number
    storageKey: string
    courseId: string | null
    moduleId: string | null
    disciplineId: string | null
}
