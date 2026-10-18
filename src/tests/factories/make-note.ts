import type { Note } from "@prisma/client";
import { randomUUID } from "node:crypto";

export const makeNote = (overrides?: Partial<Note>): Note => ({
  id: randomUUID(),
  userId: randomUUID(),
  title: `note ${randomUUID()}`,
  content: "content",
  courseId: null,
  moduleId: null,
  disciplineId: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  deletedAt: null,
  ...overrides
});
