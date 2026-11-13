import type { Module } from "@prisma/client";
import type { CreateModuleDTO } from "../../modules/modules/DTOs/create-module.dto";
import { randomUUID } from "node:crypto";

  export const makeModule = (overrides?: Partial<CreateModuleDTO>): Module => ({
    id: randomUUID(),
    courseId: "1",
    title: `Module ${randomUUID()}`,
    description: "test",
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
    ...overrides
  });