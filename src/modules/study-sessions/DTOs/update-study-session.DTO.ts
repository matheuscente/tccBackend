import type { StudySessionStatus } from "@prisma/client";

export interface UpdateStudySessionDTO {
  studiedAt?:string | Date,
  status?: StudySessionStatus
}