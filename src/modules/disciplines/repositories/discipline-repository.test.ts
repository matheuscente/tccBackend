import type { Course, Discipline, Module, User } from "@prisma/client";
import { prismaTests } from "../../../lib/prisma-tests";
import { makeDiscipline } from "../../../tests/factories/make-discipline";
import { makeModule } from "../../../tests/factories/make-module";
import { makeCourse } from "../../../tests/factories/make-course";
import { makeUser } from "../../../tests/factories/make-user";
import { CourseRepository } from "../../courses/repositories/course.repository";
import { UserRepository } from "../../users/repositories/user.repository";
import { ModuleRepository } from "../../modules/repositories/module.repository";
import { DisciplineRepository } from "./discipline.repository";
import { makeGoal } from "../../../tests/factories/make-goal";

describe("discipline repository tests", () => {
  const moduleRepository = new ModuleRepository(prismaTests);
  const userRepository = new UserRepository(prismaTests);
  const courseRepository = new CourseRepository(prismaTests, moduleRepository);
  const disciplineRepository = new DisciplineRepository(prismaTests);

  let user: User, module: Module, course: Course, discipline: Discipline;

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
    discipline = await prismaTests.discipline.create({
      data: makeDiscipline({ moduleId: module.id }),
    });
  });

  afterEach(async () => {
    await prismaTests.discipline.deleteMany();
    await prismaTests.module.deleteMany();
    await prismaTests.course.deleteMany();
    await prismaTests.user.deleteMany();
  });

  describe("findAllByModuleId tests", () => {
    it("should look for all the disciplines in a module", async () => {
      const module2 = await prismaTests.module.create({
        data: makeModule({ courseId: course.id }),
      });
      await prismaTests.discipline.create({
        data: makeDiscipline({ moduleId: module2.id }),
      });
      await prismaTests.discipline.create({
        data: makeDiscipline({ moduleId: module.id }),
      });

      const foundDisciplines = await disciplineRepository.findAllByModuleId(module.id);

      expect(foundDisciplines).toHaveLength(2);
      expect(foundDisciplines.every((d) => d.moduleId === module.id)).toBe(true);
    });

    it("should return an empty array because there is no discipline in the module with the given ID", async () => {
      const module2 = await prismaTests.module.create({
        data: makeModule({ courseId: course.id }),
      });

      const foundDisciplines = await disciplineRepository.findAllByModuleId(module2.id);

      expect(foundDisciplines).toHaveLength(0);
    });

    it("should not return soft deleted disciplines", async () => {
      await disciplineRepository.softDelete(discipline.id);

      const disciplines = await disciplineRepository.findAllByModuleId(module.id);

      expect(disciplines).toHaveLength(0);
    });
  });

  describe("findById tests", () => {
    it("should not return soft deleted disciplines", async () => {
      await disciplineRepository.softDelete(discipline.id);

      const deletedDiscipline = await disciplineRepository.findById(discipline.id);

      expect(deletedDiscipline).toBeNull();
    });

    it("should only search for the requested discipline", async () => {
      const foundDiscipline = await disciplineRepository.findById(discipline.id);

      expect(foundDiscipline).not.toBeNull();
      expect(foundDiscipline).toEqual(discipline);
    });

    it("should return null because there is no discipline with the given ID", async () => {
      const foundDiscipline = await disciplineRepository.findById("fake-id");

      expect(foundDiscipline).toBeNull();
    });
  });

  describe("findAllByUserId tests", () => {
    it("should not return soft deleted disciplines", async () => {
      await disciplineRepository.softDelete(discipline.id);

      const disciplines = await disciplineRepository.findAllByUserId(user.id);

      expect(disciplines).toHaveLength(0);
    });

    it("should look for all the disciplines of a user", async () => {
      await prismaTests.discipline.create({
        data: makeDiscipline({ moduleId: module.id }),
      });

      const foundDisciplines = await disciplineRepository.findAllByUserId(user.id);

      expect(foundDisciplines).toHaveLength(2);
      expect(foundDisciplines.every((d) => d.moduleId === module.id)).toBe(true);
    });

    it("should return an empty array because there is no discipline of the user with the given ID", async () => {
      const user2 = await userRepository.create(makeUser());

      const foundDisciplines = await disciplineRepository.findAllByUserId(user2.id);

      expect(foundDisciplines).toHaveLength(0);
    });

    it("should not return disciplines from another user", async () => {
      const user2 = await userRepository.create(makeUser());
      const course2 = await courseRepository.create(makeCourse({ userId: user2.id }));
      const module2 = await prismaTests.module.create({
        data: makeModule({ courseId: course2.id }),
      });
      await prismaTests.discipline.create({
        data: makeDiscipline({ moduleId: module2.id }),
      });

      const foundDisciplines = await disciplineRepository.findAllByUserId(user.id);

      expect(foundDisciplines.every((d) => d.moduleId === module.id)).toBe(true);
    });
  });

  describe("findByIdWithOwner tests", () => {
    it("should not return soft deleted disciplines", async () => {
      await disciplineRepository.softDelete(discipline.id);

      const deletedDiscipline = await disciplineRepository.findByIdWithOwner(
        discipline.id,
        user.id,
      );

      expect(deletedDiscipline).toBeNull();
    });

    it("should only search for the requested discipline of a specific user", async () => {
      const foundDiscipline = await disciplineRepository.findByIdWithOwner(
        discipline.id,
        user.id,
      );

      expect(foundDiscipline).not.toBeNull();
      expect(foundDiscipline).toEqual(discipline);
    });

    it("should return null because there is no discipline with the given ID", async () => {
      const foundDiscipline = await disciplineRepository.findByIdWithOwner(
        "fake-id",
        user.id,
      );

      expect(foundDiscipline).toBeNull();
    });

    it("should return null if the discipline exists but belongs to another user", async () => {
      const user2 = await userRepository.create(makeUser());

      const foundDiscipline = await disciplineRepository.findByIdWithOwner(
        discipline.id,
        user2.id,
      );

      expect(foundDiscipline).toBeNull();
    });
  });

  describe("findAllByModuleIdWithOwner tests", () => {
    it("should not return soft deleted disciplines", async () => {
      await disciplineRepository.softDelete(discipline.id);

      const disciplines = await disciplineRepository.findAllByModuleIdWithOwner(
        module.id,
        user.id,
      );

      expect(disciplines).toHaveLength(0);
    });

    it("should look for all the disciplines in a module of a user", async () => {
      await prismaTests.discipline.create({
        data: makeDiscipline({ moduleId: module.id }),
      });

      const foundDisciplines = await disciplineRepository.findAllByModuleIdWithOwner(
        module.id,
        user.id,
      );

      expect(foundDisciplines).toHaveLength(2);
      expect(foundDisciplines.every((d) => d.moduleId === module.id)).toBe(true);
    });

    it("should return an empty array because there is no discipline in the module with the given ID", async () => {
      const module2 = await prismaTests.module.create({
        data: makeModule({ courseId: course.id }),
      });

      const foundDisciplines = await disciplineRepository.findAllByModuleIdWithOwner(
        module2.id,
        user.id,
      );

      expect(foundDisciplines).toHaveLength(0);
    });

    it("should not return disciplines from another user", async () => {
      const user2 = await userRepository.create(makeUser());
      const course2 = await courseRepository.create(makeCourse({ userId: user2.id }));
      const module2 = await prismaTests.module.create({
        data: makeModule({ courseId: course2.id }),
      });
      await prismaTests.discipline.create({
        data: makeDiscipline({ moduleId: module2.id }),
      });

      const foundDisciplines = await disciplineRepository.findAllByModuleIdWithOwner(
        module2.id,
        user.id,
      );

      expect(foundDisciplines).toHaveLength(0);
    });
  });

  describe("findByIdWithCourse tests", () => {
    it("should return discipline with nested module.course.userId", async () => {
      const found = await disciplineRepository.findByIdWithCourse(discipline.id);

      expect(found).not.toBeNull();
      expect(found?.id).toBe(discipline.id);
      expect(found?.module.course.userId).toBe(user.id);
    });

    it("should return null because there is no discipline with the given ID", async () => {
      const found = await disciplineRepository.findByIdWithCourse("fake-id");

      expect(found).toBeNull();
    });

    it("should not return soft deleted disciplines", async () => {
      await disciplineRepository.softDelete(discipline.id);

      const found = await disciplineRepository.findByIdWithCourse(discipline.id);

      expect(found).toBeNull();
    });
  });

  describe("softDelete tests", () => {
    it("should soft delete a discipline", async () => {
      await disciplineRepository.softDelete(discipline.id);

      const deletedDiscipline = await prismaTests.discipline.findUnique({
        where: { id: discipline.id },
      });

      expect(deletedDiscipline).not.toBeNull();
      expect(deletedDiscipline?.deletedAt).not.toBeNull();
      expect(deletedDiscipline?.deletedAt).toBeInstanceOf(Date);
    });

    it("should not throw if discipline does not exist", async () => {
      await expect(
        disciplineRepository.softDelete("fake-id"),
      ).resolves.not.toThrow();
    });
  });

  describe("softDeleteAllByModuleIds tests", () => {
    it("should soft delete all disciplines from given module ids", async () => {
      const module2 = await prismaTests.module.create({
        data: makeModule({ courseId: course.id }),
      });
      await prismaTests.discipline.create({
        data: makeDiscipline({ moduleId: module.id }),
      });
      await prismaTests.discipline.create({
        data: makeDiscipline({ moduleId: module2.id }),
      });

      await disciplineRepository.softDeleteAllByModuleIds([module.id]);

      const disciplinesFromModule1 = await prismaTests.discipline.findMany({
        where: { moduleId: module.id },
      });
      const disciplinesFromModule2 = await prismaTests.discipline.findMany({
        where: { moduleId: module2.id },
      });

      expect(disciplinesFromModule1.every((d) => d.deletedAt !== null)).toBe(true);
      expect(disciplinesFromModule2.every((d) => d.deletedAt === null)).toBe(true);
    });

    it("should not throw if moduleIds array is empty", async () => {
      await expect(
        disciplineRepository.softDeleteAllByModuleIds([]),
      ).resolves.not.toThrow();
    });

    it("should delete all goals from disciplines in given module ids", async () => {
    const goal = await prismaTests.goal.create({
        data: makeGoal({ userId: user.id, disciplineId: discipline.id })
    })

    await disciplineRepository.softDeleteAllByModuleIds([module.id])

    const deletedGoal = await prismaTests.goal.findUnique({
        where: { id: goal.id }
    })

    expect(deletedGoal).toBeNull()
})
  });

  describe("create tests", () => {
    it("should create a discipline", async () => {
      const data = makeDiscipline({ moduleId: module.id });

      const createdDiscipline = await disciplineRepository.create(data);

      expect(createdDiscipline).not.toBeNull();
      expect(createdDiscipline.id).toBeDefined();
      expect(createdDiscipline.moduleId).toBe(module.id);
      expect(createdDiscipline.deletedAt).toBeNull();

      const disciplineInDb = await prismaTests.discipline.findUnique({
        where: { id: createdDiscipline.id },
      });

      expect(disciplineInDb).not.toBeNull();
      expect(disciplineInDb?.id).toBe(createdDiscipline.id);
    });

    it("should throw if module does not exist", async () => {
      const data = makeDiscipline({ moduleId: "fake-id" });

      await expect(disciplineRepository.create(data)).rejects.toThrow();
    });

    it("should not allow duplicate active discipline title in same module", async () => {
      const data = makeDiscipline({ moduleId: module.id, title: "Intro" });

      await disciplineRepository.create(data);

      await expect(disciplineRepository.create(data)).rejects.toThrow();
    });

    it("should allow duplicate title if previous is soft deleted", async () => {
      const data = makeDiscipline({ moduleId: module.id, title: "Intro" });

      const created = await disciplineRepository.create(data);

      await disciplineRepository.softDelete(created.id);

      await expect(
        disciplineRepository.create(
          makeDiscipline({ title: "Intro", moduleId: module.id }),
        ),
      ).resolves.not.toThrow();
    });

    it("should allow duplicate title if of another module", async () => {
      const module2 = await prismaTests.module.create({
        data: makeModule({ courseId: course.id }),
      });

      const data = makeDiscipline({ moduleId: module.id, title: "Intro" });

      await disciplineRepository.create(data);

      await expect(
        disciplineRepository.create(
          makeDiscipline({ title: "Intro", moduleId: module2.id }),
        ),
      ).resolves.not.toThrow();
    });
  });

  describe("update tests", () => {
    it("should update a discipline successfully", async () => {
      const updated = await disciplineRepository.update(discipline.id, {
        title: "Updated title",
      });

      expect(updated.title).toBe("Updated title");

      const disciplineInDb = await prismaTests.discipline.findUnique({
        where: { id: discipline.id },
      });

      expect(disciplineInDb?.title).toBe("Updated title");
    });

    it("should throw if discipline does not exist", async () => {
      await expect(
        disciplineRepository.update("fake-id", { title: "New title" }),
      ).rejects.toThrow();
    });

    it("should not allow duplicate active title in same module", async () => {
      await disciplineRepository.update(discipline.id, {
        title: "Base title",
      });

      await disciplineRepository.create(
        makeDiscipline({ moduleId: module.id, title: "Existing title" }),
      );

      await expect(
        disciplineRepository.update(discipline.id, { title: "Existing title" }),
      ).rejects.toThrow();
    });

    it("should allow duplicate title if of another module", async () => {
      const module2 = await prismaTests.module.create({
        data: makeModule({ courseId: course.id }),
      });

      const discipline2 = await disciplineRepository.create(
        makeDiscipline({ moduleId: module2.id, title: "test" }),
      );

      await expect(
        disciplineRepository.update(discipline2.id, {
          title: discipline.title,
        }),
      ).resolves.not.toThrow();
    });

    it("should allow updating title to one that belongs to a soft deleted discipline", async () => {
      const other = await disciplineRepository.create(
        makeDiscipline({ moduleId: module.id, title: "Soft Title" }),
      );

      await disciplineRepository.softDelete(other.id);

      const deletedDiscipline = await prismaTests.discipline.findUnique({
        where: { id: other.id },
      });

      expect(deletedDiscipline?.deletedAt).not.toBeNull();

      await expect(
        disciplineRepository.update(discipline.id, { title: "Soft Title" }),
      ).resolves.not.toThrow();
    });
  });
});