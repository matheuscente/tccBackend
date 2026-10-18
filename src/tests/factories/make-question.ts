import type { QuestionOption } from "@prisma/client";
import type { QuestionWithOptionsDTO } from "../../modules/questions/DTOs/question-with-options.DTO";
import { randomUUID } from "node:crypto";

export const makeQuestionOption = (overrides?: Partial<QuestionOption>): QuestionOption => ({
  id: randomUUID(),
  questionId: randomUUID(),
  text: `option ${randomUUID()}`,
  isCorrect: false,
  order: 0,
  ...overrides
});

export const makeQuestion = (overrides?: Partial<QuestionWithOptionsDTO>): QuestionWithOptionsDTO => {
  const id = overrides?.id ?? randomUUID();

  return {
    id,
    userId: randomUUID(),
    statement: `statement ${randomUUID()}`,
    type: "MULTIPLE_CHOICE",
    explanation: "explanation",
    courseId: randomUUID(),
    moduleId: null,
    disciplineId: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
    options: [
      makeQuestionOption({ questionId: id, text: "A", isCorrect: true, order: 0 }),
      makeQuestionOption({ questionId: id, text: "B", isCorrect: false, order: 1 })
    ],
    ...overrides
  };
};
