import type { StudySession } from "@prisma/client";
import { randomUUID } from "crypto";


export const makeStudySession = (overrides?: Partial<StudySession>): StudySession => (
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