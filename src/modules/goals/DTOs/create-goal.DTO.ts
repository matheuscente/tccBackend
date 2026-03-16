import type { GoalType } from "@prisma/client"

export interface CreateGoalDTO {
    title: string
    type: GoalType
    targetMinutes: number
    startDate: string
    endDate?: string | null
    courseId?: string | null
    moduleId?: string | null
    disciplineId?: string | null
}