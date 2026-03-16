import type { GoalType } from "@prisma/client"

export interface CreateGoalRepositoryDTO {
    userId: string
    title: string
    type: GoalType
    targetMinutes: number
    startDate: Date
    endDate?: Date | null
    courseId?: string | null
    moduleId?: string | null
    disciplineId?: string | null
}