import type { Course } from "@prisma/client";
import { randomUUID } from "node:crypto";

export const makeCourse = (overrides?: Partial<Course>): Course => ({
    id: randomUUID(),
    userId: "1",
    title: "test",
    description: "test",
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
    ...overrides
})