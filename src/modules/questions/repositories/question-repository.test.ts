import type { Course, User } from "@prisma/client";
import { prismaTests } from "../../../lib/prisma-tests";
import { makeUser } from "../../../tests/factories/make-user";
import { makeCourse } from "../../../tests/factories/make-course";
import { UserRepository } from "../../users/repositories/user.repository";
import { ActivityRepository } from "../../activities/repositories/activity.repository";
import { QuestionRepository } from "./question.repository";

describe("question repository tests", () => {
  const userRepository = new UserRepository(prismaTests);
  const activityRepository = new ActivityRepository(prismaTests);
  const repository = new QuestionRepository(prismaTests);

  let user: User;
  let course: Course;

  const createQuestion = () => prismaTests.question.create({
    data: {
      userId: user.id,
      courseId: course.id,
      statement: "What is 2 + 2?",
      type: "MULTIPLE_CHOICE",
      options: { create: [{ text: "4", isCorrect: true, order: 0 }, { text: "5", isCorrect: false, order: 1 }] }
    }
  });

  const createActivity = (title: string) =>
    activityRepository.create({ userId: user.id, title, description: null, courseId: course.id, moduleId: null, disciplineId: null });

  beforeEach(async () => {
    user = await userRepository.create(makeUser());
    const { id, title, description } = makeCourse();
    course = await prismaTests.course.create({ data: { id, title, description, userId: user.id } });
  });

  afterEach(async () => {
    await prismaTests.activity.deleteMany();
    await prismaTests.question.deleteMany();
    await prismaTests.course.deleteMany();
    await prismaTests.user.deleteMany();
  });

  describe("findActivitiesUsing tests", () => {
    it("should list the activities that use the question ordered by title", async () => {
      const question = await createQuestion();
      const second = await createActivity("B activity");
      const first = await createActivity("A activity");
      await activityRepository.setQuestions(second.id, [question.id]);
      await activityRepository.setQuestions(first.id, [question.id]);

      const activities = await repository.findActivitiesUsing(question.id);

      expect(activities).toEqual([{ id: first.id, title: "A activity" }, { id: second.id, title: "B activity" }]);
    });

    it("should ignore deleted activities and activities without the question", async () => {
      const question = await createQuestion();
      const other = await createQuestion();
      const deleted = await createActivity("deleted");
      const unrelated = await createActivity("unrelated");
      await activityRepository.setQuestions(deleted.id, [question.id]);
      await activityRepository.setQuestions(unrelated.id, [other.id]);
      await prismaTests.activity.update({ where: { id: deleted.id }, data: { deletedAt: new Date() } });

      expect(await repository.findActivitiesUsing(question.id)).toEqual([]);
    });
  });
});
