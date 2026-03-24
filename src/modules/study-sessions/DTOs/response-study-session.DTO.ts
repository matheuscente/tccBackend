export interface ResponseStudySessionDTO {
  id: string,
  minutes: number,
  courseId: string | null,
  moduleId: string | null,
  disciplineId: string | null,
  studiedAt: Date
  createdAt: Date
}