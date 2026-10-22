import { updateCourseSchema } from "./update-course.schema";

describe("updateCourseSchema", () => {
  it("should report the maximum length when the title is too long", () => {
    const { error } = updateCourseSchema.validate({ title: "a".repeat(101) });

    expect(error?.details[0]?.message).toBe("O campo título deve conter no máximo 100 digitos.");
  });
});
