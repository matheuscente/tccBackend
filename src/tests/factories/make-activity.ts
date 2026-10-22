import type { Activity } from "@prisma/client";
import type { ActivityWithQuestionsDTO } from "../../modules/activities/DTOs/activity-with-questions.DTO";
import type { ActivityWithStatsDTO } from "../../modules/activities/DTOs/activity-with-stats.DTO";
import type { AttemptWithActivityDTO } from "../../modules/activities/DTOs/attempt-with-activity.DTO";
import type { AttemptWithAnswersDTO } from "../../modules/activities/DTOs/attempt-with-answers.DTO";
import type { QuestionWithOptionsDTO } from "../../modules/questions/DTOs/question-with-options.DTO";
import { randomUUID } from "node:crypto";

export const makeActivity = (overrides?: Partial<Activity>): Activity => ({
  id: randomUUID(),
  userId: randomUUID(),
  title: `activity ${randomUUID()}`,
  description: "description",
  courseId: randomUUID(),
  moduleId: null,
  disciplineId: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  deletedAt: null,
  ...overrides
});

export const makeActivityWithStats = (overrides?: Partial<ActivityWithStatsDTO>): ActivityWithStatsDTO => ({
  ...makeActivity(),
  _count: { questions: 0, attempts: 0 },
  attempts: [],
  ...overrides
});

export const makeActivityWithQuestions = (
  activity: Activity,
  questions: QuestionWithOptionsDTO[] = []
): ActivityWithQuestionsDTO => ({
  ...activity,
  questions: questions.map((question, order) => ({ order, question }))
});

export const makeActivityAttempt = (
  overrides?: Partial<AttemptWithActivityDTO>
): AttemptWithActivityDTO => {
  const activityId = overrides?.activityId ?? randomUUID();

  return {
    id: randomUUID(),
    activityId,
    userId: randomUUID(),
    correctCount: 1,
    totalQuestions: 2,
    score: 50,
    startedAt: new Date("2026-01-01T10:00:00Z"),
    finishedAt: new Date("2026-01-01T10:05:00Z"),
    activity: { id: activityId, title: "activity" },
    ...overrides
  };
};

export const makeAttemptWithAnswers = (overrides?: Partial<AttemptWithAnswersDTO>): AttemptWithAnswersDTO => ({
  ...makeActivityAttempt(),
  answers: [],
  ...overrides
});
