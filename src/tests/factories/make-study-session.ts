import type { StudySession } from "@prisma/client";
import type { CreateStudySessionDTO } from "../../modules/study-sessions/DTOs/create-study-session.DTO";
import { randomUUID } from "crypto";


export const makeStudySession = (overrides?: Partial<StudySession>): CreateStudySessionDTO => (
    {
      id: randomUUID(),
      userId: randomUUID(),
      minutes: 10,
      courseId: null,
      moduleId: null,
      disciplineId: null,
      studiedAt: new Date(),
      createdAt: new Date(),
        ...overrides
    })