import type { Course, User } from "@prisma/client";
import { prismaTests } from "../../../lib/prisma-tests";
import { makeUser } from "../../../tests/factories/make-user";
import { makeCourse } from "../../../tests/factories/make-course";
import { UserRepository } from "../../users/repositories/user.repository";
import { Trasanction } from "../../transaction/services/transaction.service";
import { ActivityRepository } from "./activity.repository";

describe("ActivityRepository (transactional writes)", () => {
  const userRepository = new UserRepository(prismaTests);
  const repository = new ActivityRepository(prismaTests);
  const transaction = new Trasanction(prismaTests);

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

  it("should replace the questions keeping the informed order", async () => {
    const [first, second] = await Promise.all([createQuestion(), createQuestion()]);
    const activity = await repository.create({ userId: user.id, title: "activity", description: null, courseId: course.id, moduleId: null, disciplineId: null });

    await repository.setQuestions(activity.id, [first.id, second.id]);
    await repository.setQuestions(activity.id, [second.id]);

    const links = await prismaTests.activityQuestion.findMany({ where: { activityId: activity.id } });
    expect(links).toEqual([{ activityId: activity.id, questionId: second.id, order: 0 }]);
  });

  it("should roll back the activity when attaching the questions fails", async () => {
    const promise = transaction.execute(async (repositories) => {
      const created = await repositories.activityRepository.create({ userId: user.id, title: "activity", description: null, courseId: course.id, moduleId: null, disciplineId: null });
      await repositories.activityRepository.setQuestions(created.id, ["00000000-0000-4000-8000-000000000000"]);
      return created;
    });

    await expect(promise).rejects.toThrow();
    expect(await prismaTests.activity.count()).toBe(0);
  });

  it("should keep the previous questions when replacing them fails", async () => {
    const question = await createQuestion();
    const activity = await repository.create({ userId: user.id, title: "activity", description: null, courseId: course.id, moduleId: null, disciplineId: null });
    await repository.setQuestions(activity.id, [question.id]);

    const promise = transaction.execute((repositories) =>
      repositories.activityRepository.setQuestions(activity.id, ["00000000-0000-4000-8000-000000000000"])
    );

    await expect(promise).rejects.toThrow();
    const links = await prismaTests.activityQuestion.findMany({ where: { activityId: activity.id } });
    expect(links.map(link => link.questionId)).toEqual([question.id]);
  });
});
