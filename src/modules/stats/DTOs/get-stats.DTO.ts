export interface GetStatsDTO {
  userId: string
  startDate: Date
  endDate?: Date | null

  courseId?: string
  moduleId?: string
  disciplineId?: string
}

export interface StatsQueryDTO {
  userId: string
  startDate?: string
  endDate?: string
  courseId?: string
  moduleId?: string
  disciplineId?: string
}
