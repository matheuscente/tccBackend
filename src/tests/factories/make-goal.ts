import type { Goal } from "@prisma/client";
import type { CreateGoalRepositoryDTO } from "../../modules/goals/DTOs/create-goal-repository.DTO";
import { randomUUID } from "node:crypto";

export const makeGoal = (overrides?: Partial<CreateGoalRepositoryDTO>): Goal => (
    {
              id: randomUUID(),
              userId: randomUUID(),
              title: `test ${randomUUID()}`,
              type: "DAILY_ONCE",
              targetMinutes: 1000,
              startDate: new Date(),
              endDate: new Date(),
              createdAt: new Date(),
              updatedAt: new Date(),
              courseId: null,
              disciplineId: null,
              moduleId: null,
            ...overrides
    })