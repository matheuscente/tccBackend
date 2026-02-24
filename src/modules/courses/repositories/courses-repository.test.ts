import type { User } from "@prisma/client";
import { prisma } from "../../../lib/prisma";
import { prismaTests } from "../../../lib/prisma-tests";
import { makeCourse } from "../../../tests/factories/make-course";
import { makeUser } from "../../../tests/factories/make-user";
import { UserRepository } from "../../users/repositories/user.repository";
import { CourseRepository } from "./course.repository";

describe("courses repository tests", () => {
  const userRepository = new UserRepository(prismaTests);
  const repository = new CourseRepository(prismaTests);
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
    await prismaTests.course.deleteMany();
    await prismaTests.user.deleteMany();
  });

  describe("create tests", () => {
    it("should create a course successfully", async () => {
      const data = makeCourse();
      const course = await repository.create(data);

      expect(course).not.toBeNull();
      expect(course).toMatchObject(data);
    });
  });

  describe("findById tests", () => {
    it("should search for a course using your ID", async () => {
      const data = makeCourse();
      await repository.create(data);
      const course = await repository.findById(data.id);

      expect(course).not.toBeNull();
      expect(course).toMatchObject(data);
    });

    it("should return null because there is no course in the database with the given ID", async () => {
      const course = await repository.findById("fake-id");

      expect(course).toBeNull();
    });

    it("should not return a soft deleted course", async () => {
      const course = await repository.create(makeCourse());

      await repository.softDelete(course.id, course.userId);

      const result = await repository.findById(course.id);

      expect(result).toBeNull();
    });
  });

  describe("findByUserId tests", () => {
    it("should search for courses using the provided user ID.", async () => {
      const course1 = makeCourse();
      const course2 = makeCourse({ id: "2" });

      await repository.create(course1);
      await repository.create(course2);

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
      const otherUser = await userRepository.create(makeUser({ id: "other" }));

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
      const otherUser = await userRepository.create(makeUser({ id: "other" }));

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

      await repository.create(makeCourse({ id }));

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
});
