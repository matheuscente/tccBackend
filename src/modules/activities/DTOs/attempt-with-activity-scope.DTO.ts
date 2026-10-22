import type { ActivityAttempt } from "@prisma/client"

export interface AttemptWithActivityScopeDTO extends ActivityAttempt {
    activity: {
        id: string
        title: string
        courseId: string | null
        moduleId: string | null
        disciplineId: string | null
    }
}
