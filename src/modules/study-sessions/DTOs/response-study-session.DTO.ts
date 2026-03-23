export interface CreateStuSession {
  userId?: string,
  minutes: number,
  courseId?: string,
  moduleId?: string,
  disciplineId?: string,
  studiedAt: Date
  createdAt: Date
}