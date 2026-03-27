import { StudySessionStatus, type StudySession } from "@prisma/client";
import { randomUUID } from "crypto";

export const makeStudySession = (overrides?: Partial<StudySession>): StudySession => ({
    id: randomUUID(),
    userId: randomUUID(),
    minutes: 0,
    courseId: null,
    moduleId: null,
    disciplineId: null,
    startedAt: new Date(),
    status: StudySessionStatus.IN_PROGRESS,
    studiedAt: new Date(),
    createdAt: new Date(),
    ...overrides
});