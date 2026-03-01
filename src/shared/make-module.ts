import type { Module } from "@prisma/client";
import type { CreateModuleDTO } from "../modules/modules/DTOs/create-module.dto";

  export const makeModule = (overrides?: Partial<CreateModuleDTO>): Module => ({
    id: "1",
    courseId: "1",
    title: "test",
    description: "test",
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
    ...overrides
  });