export interface UploadedFileDTO {
    originalname: string
    mimetype: string
    size: number
    buffer: Buffer
}

export interface FileScopeDTO {
    courseId?: string | null
    moduleId?: string | null
    disciplineId?: string | null
}

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

export interface UpdateFileDTO extends FileScopeDTO {
    originalName?: string
}

export interface FileFilterDTO {
    courseId?: string
    moduleId?: string
    disciplineId?: string
    search?: string
}

export interface ResponseFileDTO {
    id: string
    originalName: string
    mimeType: string
    size: number
    courseId: string | null
    moduleId: string | null
    disciplineId: string | null
    createdAt: string
}

export interface FileAccessDTO {
    viewUrl: string
    downloadUrl: string
    expiresInSeconds: number
}
