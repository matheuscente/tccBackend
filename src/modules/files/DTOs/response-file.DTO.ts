export interface ResponseFileDTO {
    id: string
    originalName: string
    mimeType: string
    size: number
    position: number | null
    courseId: string | null
    moduleId: string | null
    disciplineId: string | null
    createdAt: string
}
