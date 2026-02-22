import type { Course } from "@prisma/client";

export const makeCourse = (overrides?: Partial<Course>): Course => ({
    id: "1",
    userId: "1",
    title: "test",
    description: "test",
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
    ...overrides
})