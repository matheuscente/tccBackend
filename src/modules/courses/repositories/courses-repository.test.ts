import type { User } from "@prisma/client";
import { prisma } from "../../../lib/prisma";
import { prismaTests } from "../../../lib/prisma-tests";
import { makeCourse } from "../../../tests/factories/make-course";
import { makeUser } from "../../../tests/factories/make-user";
import { UserRepository } from "../../users/repositories/user.repository";
import { CourseRepository } from "./course.repository";
import { ModuleRepository } from "../../modules/repositories/module.repository";
import { makeModule } from "../../../shared/make-module";

describe("courses repository tests", () => {
  const userRepository = new UserRepository(prismaTests);
  const moduleRepository = new ModuleRepository(prismaTests);
  const repository = new CourseRepository(prismaTests, moduleRepository);
  let user: User;

  beforeAll(async () => {
    await prismaTests.$connect();
  });

  afterAll(async () => {
    await prismaTests.$disconnect();
  });

  beforeEach(async () => {
    user = await userRepository.create(makeUser());
  });

  afterEach(async () => {
    await prismaTests.module.deleteMany();
    await prismaTests.course.deleteMany();
    await prismaTests.user.deleteMany();
  });

  describe("create tests", () => {
    it("should create a course successfully", async () => {
      const data = makeCourse({ userId: user.id });
      const course = await repository.create(data);

      expect(course).not.toBeNull();
      expect(course).toMatchObject(data);
    });

    it("This should throw an error because a course with the given title already exists.", async () => {
      await repository.create(makeCourse({ userId: user.id, title: "test" }));

      await expect(
        repository.create(makeCourse({ userId: user.id, title: "test" })),
      ).rejects.toThrow();
    });

    it("It should create a course and not return a title constraint error.", async () => {
      const course = await repository.create(
        makeCourse({ userId: user.id, title: "test" }),
      );

      await prismaTests.course.update({
        where: { id: course.id },
        data: {
          deletedAt: new Date(),
        },
      });

      const data = makeCourse({ userId: user.id, title: "test" });

      const course2 = await repository.create(makeCourse(data));

      expect(course2).not.toBe(null);
      expect(course2).toMatchObject(data);
    });

    it("It should update a course and not return a title constraint error beacuse is another user course.", async () => {
      const course = await repository.create(
        makeCourse({ userId: user.id, title: "test" }),
      );

      const user2 = await userRepository.create(makeUser());
      const course2 = await repository.create(
        makeCourse({ userId: user2.id, title: "test" }),
      );

      expect(course2).not.toBe(null);
      expect(course2.title).toBe(course.title);
    });
  });

  describe("findById tests", () => {
    it("should search for a course using your ID", async () => {
      const data = await repository.create(makeCourse({ userId: user.id }));
      const course = await repository.findById(data.id);

      expect(course).not.toBeNull();
      expect(course).toMatchObject(data);
    });

    it("should return null because there is no course in the database with the given ID", async () => {
      const course = await repository.findById("fake-id");

      expect(course).toBeNull();
    });

    it("should not return a soft deleted course", async () => {
      const course = await repository.create(makeCourse({ userId: user.id }));

      await repository.softDelete(course.id, course.userId);

      const result = await repository.findById(course.id);

      expect(result).toBeNull();
    });
  });

  describe("findByUserId tests", () => {
    it("should search for courses using the provided user ID.", async () => {

      const course1 = await repository.create(makeCourse({ userId: user.id }));
      const course2 = await repository.create(makeCourse({ userId: user.id }));

      const courses = await repository.findAllByUserId(user.id);

      expect(courses).not.toBeNull();
      expect(courses).toHaveLength(2);
      expect(courses).toEqual(expect.arrayContaining([course1, course2]));
    });

    it("should return an empty array because there is no course in the database with the given userId", async () => {
      const courses = await repository.findAllByUserId(user.id);

      expect(courses.length).toBe(0);
    });

    it("should not return courses from another user", async () => {
      const otherUser = await userRepository.create(makeUser());

      await repository.create(makeCourse({ userId: otherUser.id }));

      const courses = await repository.findAllByUserId(user.id);

      expect(courses).toHaveLength(0);
    });
  });

  describe("findOwnedById tests", () => {
    it("should return course if it belongs to the user", async () => {
      const course = await repository.create(makeCourse({ userId: user.id }));

      const result = await repository.findOwnedById(course.id, user.id);

      expect(result).not.toBeNull();
      expect(result?.id).toBe(course.id);
    });

    it("should return null if course belongs to another user", async () => {
      const otherUser = await userRepository.create(makeUser());

      const course = await repository.create(
        makeCourse({ userId: otherUser.id }),
      );

      const result = await repository.findOwnedById(course.id, user.id);

      expect(result).toBeNull();
    });
  });

  describe("softDelete tests", () => {
    it("should delete a course based on the provided ID.", async () => {
      const id = "1";

      await repository.create(makeCourse({ id, userId: user.id }));

      await repository.softDelete(id, user.id);

      const course = await repository.findById(id);

      expect(course).toBeNull();
    });

    it("should not return an error even if there are no courses in the database.", async () => {
      const id = "1";

      const course = repository.softDelete(id, user.id);

      await expect(course).resolves.toBeUndefined();
    });
  });

  describe("update tests", () => {
    it("This should throw an error because a course with the given title already exists.", async () => {
      const course = await repository.create(
        makeCourse({ userId: user.id, title: "test" }),
      );
      const course2 = await repository.create(
        makeCourse({ userId: user.id, title: "test 2" }),
      );

      await expect(
        repository.update(course2.id, {
          description: course.description,
          title: "test",
        }),
      ).rejects.toThrow();
    });

    it("It should update a course and not return a title constraint error.", async () => {
      const course = await repository.create(
        makeCourse({ userId: user.id, title: "test" }),
      );
      const course2 = await repository.create(
        makeCourse({ userId: user.id, title: "test 2" }),
      );

      await prismaTests.course.update({
        where: { id: course.id },
        data: {
          deletedAt: new Date(),
        },
      });

      const updatedCourse = await repository.update(course2.id, {
        description: course2.description,
        title: "test",
      });
      expect(updatedCourse).not.toBe(null);
      expect(updatedCourse.title).toBe(course.title);
    });

    it("It should update a course and not return a title constraint error beacuse is another user course.", async () => {
      const course = await repository.create(
        makeCourse({ userId: user.id, title: "test" }),
      );

      const user2 = await userRepository.create(makeUser());
      const course2 = await repository.create(
        makeCourse({ userId: user2.id, title: "test 2" }),
      );

      await prismaTests.course.update({
        where: { id: course.id },
        data: {
          deletedAt: new Date(),
        },
      });

      const updatedCourse = await repository.update(course2.id, {
        description: course2.description,
        title: "test",
      });

      expect(updatedCourse).not.toBe(null);
      expect(updatedCourse.title).toBe(course.title);
    });
    it("should update a course successfully", async () => {
      const newTitle = "updated course";
      const description = "this course was updated";
      const course = await repository.create(makeCourse({ userId: user.id }));

      await repository.update(course.id, {
        title: newTitle,
        description: description,
      });

      const updatedCourse = await repository.findById(course.id);

      expect(updatedCourse?.updatedAt).not.toBeNull();
      expect(updatedCourse).toMatchObject({
        id: course.id,
        title: newTitle,
        description: description,
        createdAt: course.createdAt,
        userId: course.userId,
      });
    });

    it("should throw an error because there are no courses with the given ID in the database.", async () => {
      const newTitle = "updated course";
      const description = "this course was updated";

      const updatedCourse = repository.update("fake-id", {
        title: newTitle,
        description: description,
      });

      await expect(updatedCourse).rejects.toThrow();
    });
  });

  describe("softDeleteAllByUserId tests", () => {
    it("should soft delete all courses of a user", async () => {
      const id = "1";

      await repository.create(makeCourse({ id: "1", userId: user.id }));
      await repository.create(makeCourse({ id: "2", userId: user.id }));

      await prismaTests.module.create({ data: makeModule({ courseId: id }) });

      await repository.softDeleteAllByUserId(user.id);

      const course = await repository.findAllByUserId(user.id);

      const modules = await prismaTests.module.findMany({
        where: {
          courseId: id,
        },
      });

      expect(course).toHaveLength(0);
      expect(modules).toHaveLength(1);
      expect(modules[0]).toBeDefined();
      expect(modules[0]?.deletedAt).not.toBe(null);
    });

    it("should not return an error even if there are no courses in the database.", async () => {
      const id = "1";

      const course = repository.softDeleteAllByUserId(user.id);

      await expect(course).resolves.toBeUndefined();
    });
  });
});
