export interface ModuleWithCourseDTO {
    id: string
    courseId: string
    title: string
    description: string | null
    createdAt: Date
    updatedAt: Date
    deletedAt: Date | null
    course: {
        userId: string
    }
}