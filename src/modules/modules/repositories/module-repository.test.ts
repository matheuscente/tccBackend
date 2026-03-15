import type { Course, Module, User } from "@prisma/client";
import { prismaTests } from "../../../lib/prisma-tests";
import { makeModule } from "../../../tests/factories/make-module";
import { makeCourse } from "../../../tests/factories/make-course";
import { makeUser } from "../../../tests/factories/make-user";
import { CourseRepository } from "../../courses/repositories/course.repository";
import { UserRepository } from "../../users/repositories/user.repository";
import { ModuleRepository } from "./module.repository";
import { makeDiscipline } from "../../../tests/factories/make-discipline";

describe("module repository tests", () => {
  const moduleRepository = new ModuleRepository(prismaTests);
  const userRepository = new UserRepository(prismaTests);
  const courseRepository = new CourseRepository(prismaTests, moduleRepository);

  let user: User, module: Module, course: Course;

  beforeAll(async () => {
    await prismaTests.$connect();
  });

  afterAll(async () => {
    await prismaTests.$disconnect();
  });

  beforeEach(async () => {
    user = await userRepository.create(makeUser());
    course = await courseRepository.create(makeCourse({ userId: user.id }));
    module = await prismaTests.module.create({
      data: makeModule({ courseId: course.id }),
    });
  });

  afterEach(async () => {
    await prismaTests.module.deleteMany();
    await prismaTests.course.deleteMany();
    await prismaTests.user.deleteMany();
  });

  describe("findAllByCourseId tests", () => {
    it("should look for all the modules in a course.", async () => {
      const course2 = await courseRepository.create(
        makeCourse({ userId: user.id }),
      );
      await prismaTests.module.create({
        data: makeModule({ courseId: course2.id }),
      });

      await prismaTests.module.create({
        data: makeModule({ courseId: course.id }),
      });

      const foundModules = await moduleRepository.findAllByCourseId(course.id);

      expect(foundModules).toHaveLength(2);
      expect(foundModules.every((m) => m.courseId === course.id)).toBe(true);
    });

    it("should return an empty array because there is no module in the course with the given ID", async () => {
      const course2 = await courseRepository.create(
        makeCourse({ userId: user.id }),
      );

      const foundModules = await moduleRepository.findAllByCourseId(course2.id);

      expect(foundModules).toHaveLength(0);
    });

    it("should not return soft deleted modules", async () => {
      await moduleRepository.softDelete(module.id);

      const modules = await moduleRepository.findAllByCourseId(course.id);

      expect(modules).toHaveLength(0);
    });
  });

  describe("findById tests", () => {
    it("should not return soft deleted modules", async () => {
      await moduleRepository.softDelete(module.id);

      const deletedModule = await moduleRepository.findById(module.id);

      expect(deletedModule).toBeNull();
    });
    it("should only search for the requested module.", async () => {
      const findedModule = await moduleRepository.findById(module.id);

      expect(findedModule).not.toBeNull();
      expect(findedModule).toEqual(module);
    });

    it("It should return null because there is no module with the given ID.", async () => {
      const findedModule = await moduleRepository.findById("fake-id");

      expect(findedModule).toBeNull();
    });
  });

  describe("findAllByUserId tests", () => {
    it("should not return soft deleted modules", async () => {
      await moduleRepository.softDelete(module.id);

      const modules = await moduleRepository.findAllByUserId(user.id);

      expect(modules).toHaveLength(0);
    });
    it("should look for all the modules of a user", async () => {
      await prismaTests.module.create({
        data: makeModule({ courseId: course.id }),
      });

      const foundModules = await moduleRepository.findAllByUserId(user.id);
      expect(foundModules).toHaveLength(2);
      expect(foundModules.every((m) => m.courseId === course.id)).toBe(true);
    });

    it("should return an empty array because there is no module of the user with the given ID", async () => {
      const user2 = await userRepository.create(makeUser());

      const foundModules = await moduleRepository.findAllByUserId(user2.id);

      expect(foundModules).toHaveLength(0);
    });

    it("should not return modules from another user", async () => {
      const user2 = await userRepository.create(makeUser());
      const course2 = await courseRepository.create(
        makeCourse({ userId: user2.id }),
      );

      await prismaTests.module.create({
        data: makeModule({ courseId: course2.id }),
      });

      const foundModules = await moduleRepository.findAllByUserId(user.id);

      expect(foundModules.every((m) => m.courseId === course.id)).toBe(true);
    });
  });

  describe("findByIdWithOwner tests", () => {
    it("should not return soft deleted modules", async () => {
      await moduleRepository.softDelete(module.id);

      const deletedModule = await moduleRepository.findByIdWithOwner(
        module.id,
        user.id,
      );

      expect(deletedModule).toBeNull();
    });
    it("should only search for the requested module of a specific user.", async () => {
      const findedModule = await moduleRepository.findByIdWithOwner(
        module.id,
        user.id,
      );

      expect(findedModule).not.toBeNull();
      expect(findedModule).toEqual(module);
    });

    it("It should return null because there is no module with the given ID.", async () => {
      const findedModule = await moduleRepository.findByIdWithOwner(
        "fake-id",
        user.id,
      );

      expect(findedModule).toBeNull();
    });

    it("should return null if the module exists but belongs to another user", async () => {
      const user2 = await userRepository.create(makeUser());

      const findedModule = await moduleRepository.findByIdWithOwner(
        module.id,
        user2.id,
      );

      expect(findedModule).toBeNull();
    });
  });

  describe("findAllByCourseIdWithOwner tests", () => {
    it("should not return soft deleted modules", async () => {
      await moduleRepository.softDelete(module.id);

      const modules = await moduleRepository.findAllByCourseIdWithOwner(
        course.id,
        user.id,
      );

      expect(modules).toHaveLength(0);
    });
    it("should look for all the modules in a course of a user.", async () => {
      const course2 = await courseRepository.create(
        makeCourse({ userId: user.id }),
      );
      await prismaTests.module.create({
        data: makeModule({ courseId: course2.id }),
      });

      await prismaTests.module.create({
        data: makeModule({ courseId: course.id }),
      });

      const foundModules = await moduleRepository.findAllByCourseIdWithOwner(
        course.id,
        user.id,
      );
      expect(foundModules).toHaveLength(2);
      expect(foundModules.every((m) => m.courseId === course.id)).toBe(true);
    });

    it("should return an empty array because there is no module in the course with the given ID", async () => {
      const course2 = await courseRepository.create(
        makeCourse({ userId: user.id }),
      );

      const foundModules = await moduleRepository.findAllByCourseIdWithOwner(
        course2.id,
        user.id,
      );

      expect(foundModules).toHaveLength(0);
    });
  });

  describe("softDelete tests", () => {
    it("should be delete a module", async () => {
      await moduleRepository.softDelete(module.id);

      const deletedModule = await prismaTests.module.findUnique({
        where: {
          id: module.id,
        },
      });

      expect(deletedModule).not.toBeNull();
      expect(deletedModule?.deletedAt).not.toBeNull();
      expect(deletedModule?.deletedAt).toBeInstanceOf(Date);
    });

    it("should not throw if module does not exist", async () => {
      await expect(
        moduleRepository.softDelete("fake-id"),
      ).resolves.not.toThrow();
    });
  });

  describe("softDeleteAllByCourseIds tests", () => {
    it("should soft delete all modules from given course ids", async () => {
      const course2 = await courseRepository.create(
        makeCourse({ userId: user.id }),
      );

      await prismaTests.module.create({
        data: makeModule({ courseId: course.id }),
      });

      await prismaTests.module.create({
        data: makeModule({ courseId: course2.id }),
      });

      await moduleRepository.softDeleteAllByCourseIds([course.id]);

      const modulesFromCourse1 = await prismaTests.module.findMany({
        where: { courseId: course.id },
      });

      const modulesFromCourse2 = await prismaTests.module.findMany({
        where: { courseId: course2.id },
      });

      const deletedModules = await prismaTests.module.findMany({
        where: {
          courseId: course.id,
          deletedAt: { not: null },
        },
      });

      expect(deletedModules).toHaveLength(2);

      expect(modulesFromCourse1.every((m) => m.deletedAt !== null)).toBe(true);

      expect(modulesFromCourse2.every((m) => m.deletedAt === null)).toBe(true);
    });

    it("should not throw if courseIds array is empty", async () => {
      await expect(
        moduleRepository.softDeleteAllByCourseIds([]),
      ).resolves.not.toThrow();
    });

    it("should soft delete all disciplines from modules in given course ids", async () => {
      const discipline = await prismaTests.discipline.create({
        data: makeDiscipline({ moduleId: module.id }),
      });

      await moduleRepository.softDeleteAllByCourseIds([course.id]);

      const deletedDiscipline = await prismaTests.discipline.findUnique({
        where: { id: discipline.id },
      });

      expect(deletedDiscipline?.deletedAt).not.toBeNull();
    });
  });

  describe("findByIdWithCourse tests", () => {
    it("should return module with nested course.userId", async () => {
      const found = await moduleRepository.findByIdWithCourse(module.id);

      expect(found).not.toBeNull();
      expect(found?.id).toBe(module.id);
      expect(found?.course.userId).toBe(user.id);
    });

    it("should return null because there is no module with the given ID", async () => {
      const found = await moduleRepository.findByIdWithCourse("fake-id");

      expect(found).toBeNull();
    });

    it("should not return soft deleted modules", async () => {
      await moduleRepository.softDelete(module.id);

      const found = await moduleRepository.findByIdWithCourse(module.id);

      expect(found).toBeNull();
    });

    it("should return the correct userId when module belongs to another user", async () => {
      const user2 = await userRepository.create(makeUser());
      const course2 = await courseRepository.create(
        makeCourse({ userId: user2.id }),
      );
      const module2 = await prismaTests.module.create({
        data: makeModule({ courseId: course2.id }),
      });

      const found = await moduleRepository.findByIdWithCourse(module2.id);

      expect(found).not.toBeNull();
      expect(found?.course.userId).toBe(user2.id);
    });
  });

  describe("create tests", () => {
    it("should create a module", async () => {
      const data = makeModule({ courseId: course.id });

      const createdModule = await moduleRepository.create(data);

      expect(createdModule).not.toBeNull();
      expect(createdModule.id).toBeDefined();
      expect(createdModule.courseId).toBe(course.id);
      expect(createdModule.deletedAt).toBeNull();

      const moduleInDb = await prismaTests.module.findUnique({
        where: { id: createdModule.id },
      });

      expect(moduleInDb).not.toBeNull();
      expect(moduleInDb?.id).toBe(createdModule.id);
    });

    it("should throw if course does not exist", async () => {
      const data = makeModule({ courseId: "fake-id" });

      await expect(moduleRepository.create(data)).rejects.toThrow();
    });

    it("should not allow duplicate active module title in same course", async () => {
      const data = makeModule({ courseId: course.id, title: "Intro" });

      await moduleRepository.create(data);

      await expect(moduleRepository.create(data)).rejects.toThrow();
    });

    it("should allow duplicate title if previous is soft deleted", async () => {
      const data = makeModule({ courseId: course.id, title: "Intro" });

      const created = await moduleRepository.create(data);

      await moduleRepository.softDelete(created.id);

      await expect(
        moduleRepository.create(
          makeModule({ title: "Intro", courseId: course.id }),
        ),
      ).resolves.not.toThrow();
    });

    it("should allow duplicate title if of another course", async () => {
      const course2 = await courseRepository.create(
        makeCourse({ userId: user.id }),
      );

      const data = makeModule({ courseId: course.id, title: "Intro" });

      await moduleRepository.create(data);

      await expect(
        moduleRepository.create(
          makeModule({ title: "Intro", courseId: course2.id }),
        ),
      ).resolves.not.toThrow();
    });
  });

  describe("update tests", () => {
    it("should update a module successfully", async () => {
      const updated = await moduleRepository.update(module.id, {
        title: "Updated title",
      });

      expect(updated.title).toBe("Updated title");

      const moduleInDb = await prismaTests.module.findUnique({
        where: { id: module.id },
      });

      expect(moduleInDb?.title).toBe("Updated title");
    });

    it("should throw if module does not exist", async () => {
      await expect(
        moduleRepository.update("fake-id", { title: "New title" }),
      ).rejects.toThrow();
    });

    it("should not allow duplicate active title in same course", async () => {
      await moduleRepository.update(module.id, {
        title: "Base title",
      });

      const other = await moduleRepository.create(
        makeModule({
          courseId: course.id,
          title: "Existing title",
        }),
      );

      await expect(
        moduleRepository.update(module.id, {
          title: "Existing title",
        }),
      ).rejects.toThrow();
    });
    it("should allow duplicate title if of another course", async () => {
      const course2 = await courseRepository.create(
        makeCourse({ userId: user.id }),
      );

      const module = await moduleRepository.create(
        makeModule({ courseId: course.id, title: "Intro" }),
      );

      const updatedModule = await moduleRepository.create({
        courseId: course2.id,
        title: "test",
      });

      await expect(
        moduleRepository.update(updatedModule.id, {
          description: updatedModule.description,
          title: module.title,
        }),
      ).resolves.not.toThrow();
    });

    it("should allow updating title to one that belongs to soft deleted module", async () => {
      const other = await moduleRepository.create(
        makeModule({
          courseId: course.id,
          title: "Soft Title",
        }),
      );

      await moduleRepository.softDelete(other.id);

      const deletedModule = await prismaTests.module.findUnique({
        where: { id: other.id },
      });

      expect(deletedModule?.deletedAt).not.toBeNull();

      await expect(
        moduleRepository.update(module.id, {
          title: "Soft Title",
        }),
      ).resolves.not.toThrow();
    });
  });
});
