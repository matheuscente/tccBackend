import type { StudySessionStatus } from "@prisma/client";

export interface CreateStudySessionRepositoryDTO {
  userId: string,
  startedAt: Date,
  status: StudySessionStatus,
  minutes: number,
  courseId: string | null,
  moduleId: string | null,
  disciplineId: string | null,
  studiedAt: Date
}