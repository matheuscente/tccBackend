import { updateStudySessionSchema } from "./update-study-session.schema";

describe("updateStudySessionSchema", () => {
  it("should accept up to 1440 minutes, the same limit of the manual registration", () => {
    expect(updateStudySessionSchema.validate({ minutes: 1440 }).error).toBeUndefined();
  });

  it("should reject more than 1440 minutes", () => {
    const { error } = updateStudySessionSchema.validate({ minutes: 1441 });

    expect(error?.details[0]?.message).toBe("O campo minutos deve ter no máximo 1440 minutos (24 horas)");
  });

  it("should use the portuguese message for non integer minutes", () => {
    const { error } = updateStudySessionSchema.validate({ minutes: 1.5 });

    expect(error?.details[0]?.message).toBe("O campo minutos deve ser um inteiro");
  });
});
