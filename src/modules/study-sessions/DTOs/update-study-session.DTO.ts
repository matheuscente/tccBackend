import type { StudySessionStatus } from "@prisma/client";

export interface UpdateStudySessionDTO {
  minutes?: number
  studiedAt?:string | Date,
  status?: StudySessionStatus
}