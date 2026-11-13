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
