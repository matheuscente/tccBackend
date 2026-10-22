import type { Activity } from "@prisma/client"

export interface ActivityWithStatsDTO extends Activity {
    _count: { questions: number, attempts: number }
    attempts: { score: number, finishedAt: Date }[]
}
