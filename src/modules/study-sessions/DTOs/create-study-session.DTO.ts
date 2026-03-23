export interface CreateStudySessionDTO {
  userId: string,
  minutes: number,
  courseId: string | null,
  moduleId: string | null,
  disciplineId: string | null,
  studiedAt: Date
}