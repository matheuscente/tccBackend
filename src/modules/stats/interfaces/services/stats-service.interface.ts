import type { AuthUserDTO } from "../../../../shared/DTOs/auth-user.DTO"
import type { GetStatsDTO, StatsQueryDTO } from "../../DTOs/get-stats.DTO"
import type { GoalProgressDTO, PerformanceDTO, StudySummaryDTO } from "../../DTOs/stats-response.DTO"
import type { StudyTimeByScopeDTO } from "../../DTOs/study-time-by-scope.DTO"
import type { StudyTimePerDayDTO } from "../../DTOs/study-time-per-day.DTO"

export interface IStatsService {
  getTotalStudyTime(data: GetStatsDTO): Promise<number>

  getStudyTimePerDay(data: GetStatsDTO): Promise<StudyTimePerDayDTO[]>

  getStudyTimeByScope(data: GetStatsDTO): Promise<StudyTimeByScopeDTO[]>

  getSummary(authUser: AuthUserDTO, query: StatsQueryDTO): Promise<StudySummaryDTO>

  getGoalsProgress(authUser: AuthUserDTO, userId: string): Promise<GoalProgressDTO[]>

  getPerformance(authUser: AuthUserDTO, query: StatsQueryDTO): Promise<PerformanceDTO>
}
