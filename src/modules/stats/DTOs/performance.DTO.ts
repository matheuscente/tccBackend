export interface PerformanceDTO {
  totalAttempts: number
  averageScore: number | null
  bestScore: number | null
  timeline: { attemptId: string, activityId: string, activityTitle: string, date: string, score: number }[]
  byActivity: { activityId: string, title: string, attempts: number, averageScore: number, bestScore: number, lastScore: number }[]
}
