import type { ActivityAttempt } from "@prisma/client"

export interface AttemptWithActivityDTO extends ActivityAttempt {
    activity: { id: string, title: string }
}
