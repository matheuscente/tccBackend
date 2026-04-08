import type { GetStatsDTO } from "../../DTOs/get-stats.DTO"
import type { StudyTimeByScopeDTO } from "../../DTOs/study-time-by-scope.DTO"
import type { StudyTimePerDayDTO } from "../../DTOs/study-time-per-day.DTO"

export interface IStatsService {
  getTotalStudyTime(data: GetStatsDTO): Promise<number>

  getStudyTimePerDay(data: GetStatsDTO): Promise<StudyTimePerDayDTO[]>

  getStudyTimeByScope(data: GetStatsDTO): Promise<StudyTimeByScopeDTO[]>
}