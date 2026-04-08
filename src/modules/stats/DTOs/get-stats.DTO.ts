export interface GetStatsDTO {
  userId: string
  startDate: Date
  endDate?: Date | null

  courseId?: string
  moduleId?: string
  disciplineId?: string
}