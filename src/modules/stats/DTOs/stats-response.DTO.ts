import type { GoalType } from "@prisma/client"
import type { StudyTimeByScopeDTO } from "./study-time-by-scope.DTO"
import type { StudyTimePerDayDTO } from "./study-time-per-day.DTO"

export interface StudySummaryDTO {
  startDate: string
  endDate: string
  totalMinutes: number
  sessionsCount: number
  averageMinutesPerDay: number
  studiedDays: number
  currentStreak: number
  perDay: StudyTimePerDayDTO[]
  byScope: StudyTimeByScopeDTO[]
}

export type GoalProgressStatus = "NOT_STARTED" | "IN_PROGRESS" | "ACHIEVED" | "EXPIRED"

export interface GoalProgressDTO {
  goalId: string
  title: string
  type: GoalType
  targetMinutes: number
  studiedMinutes: number
  percent: number
  status: GoalProgressStatus
  startDate: string
  endDate: string | null
  scope: { courseId: string | null, moduleId: string | null, disciplineId: string | null }
  daysAchieved?: number
  totalDays?: number
}

export interface PerformanceDTO {
  totalAttempts: number
  averageScore: number | null
  bestScore: number | null
  timeline: { attemptId: string, activityId: string, activityTitle: string, date: string, score: number }[]
  byActivity: { activityId: string, title: string, attempts: number, averageScore: number, bestScore: number, lastScore: number }[]
}
