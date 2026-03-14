import type { Course, Discipline } from "@prisma/client";
import { randomUUID } from "node:crypto";

export const makeDiscipline = (overrides?: Partial<Discipline>): Discipline => ({
    id: randomUUID(),
    moduleId: "1",
    title: `test ${randomUUID()}`,
    description: "test",
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
    ...overrides
})