import type { Goal, User } from "@prisma/client";
import { prismaTests } from "../../../lib/prisma-tests";
import { makeGoal } from "../../../tests/factories/make-goal";
import { makeUser } from "../../../tests/factories/make-user";
import { makeCourse } from "../../../tests/factories/make-course";
import { makeModule } from "../../../tests/factories/make-module";
import { makeDiscipline } from "../../../tests/factories/make-discipline";
import { UserRepository } from "../../users/repositories/user.repository";
import { CourseRepository } from "../../courses/repositories/course.repository";
import { ModuleRepository } from "../../modules/repositories/module.repository";
import { DisciplineRepository } from "../../disciplines/repositories/discipline.repository";
import { GoalRepository } from "./goal.repository";

describe("goal repository tests", () => {
    const moduleRepository = new ModuleRepository(prismaTests);
    const userRepository = new UserRepository(prismaTests);
    const courseRepository = new CourseRepository(prismaTests, moduleRepository);
    const goalRepository = new GoalRepository(prismaTests);

    let user: User, goal: Goal;

    beforeAll(async () => {
        await prismaTests.$connect();
    });

    afterAll(async () => {
        await prismaTests.$disconnect();
    });

    beforeEach(async () => {
        user = await userRepository.create(makeUser());
        goal = await prismaTests.goal.create({
            data: makeGoal({ userId: user.id }),
        });
    });

    afterEach(async () => {
        await prismaTests.goal.deleteMany();
        await prismaTests.discipline.deleteMany();
        await prismaTests.module.deleteMany();
        await prismaTests.course.deleteMany();
        await prismaTests.user.deleteMany();
    });

    describe("findById tests", () => {
        it("should find a goal by id", async () => {
            const found = await goalRepository.findById(goal.id);

            expect(found).not.toBeNull();
            expect(found).toEqual(goal);
        });

        it("should return null because there is no goal with the given ID", async () => {
            const found = await goalRepository.findById("fake-id");

            expect(found).toBeNull();
        });
    });

    describe("findByIdWithOwner tests", () => {
        it("should find a goal by id with owner", async () => {
            const found = await goalRepository.findByIdWithOwner(goal.id, user.id);

            expect(found).not.toBeNull();
            expect(found).toEqual(goal);
        });

        it("should return null because there is no goal with the given ID", async () => {
            const found = await goalRepository.findByIdWithOwner("fake-id", user.id);

            expect(found).toBeNull();
        });

        it("should return null if the goal exists but belongs to another user", async () => {
            const user2 = await userRepository.create(makeUser());

            const found = await goalRepository.findByIdWithOwner(goal.id, user2.id);

            expect(found).toBeNull();
        });
    });

    describe("findAllByUserId tests", () => {
        it("should return all goals of a user", async () => {
            await prismaTests.goal.create({
                data: makeGoal({ userId: user.id }),
            });

            const found = await goalRepository.findAllByUserId(user.id);

            expect(found).toHaveLength(2);
            expect(found.every((g) => g.userId === user.id)).toBe(true);
        });

        it("should return an empty array when user has no goals", async () => {
            const user2 = await userRepository.create(makeUser());

            const found = await goalRepository.findAllByUserId(user2.id);

            expect(found).toHaveLength(0);
        });

        it("should not return goals from another user", async () => {
            const user2 = await userRepository.create(makeUser());
            await prismaTests.goal.create({
                data: makeGoal({ userId: user2.id }),
            });

            const found = await goalRepository.findAllByUserId(user.id);

            expect(found.every((g) => g.userId === user.id)).toBe(true);
        });

        it("should return goals ordered by createdAt desc", async () => {
            await prismaTests.goal.create({
                data: makeGoal({ userId: user.id }),
            });

            const found = await goalRepository.findAllByUserId(user.id);

            expect(found).toHaveLength(2);
            expect(found[0]!.createdAt.getTime())
                .toBeGreaterThanOrEqual(found[1]!.createdAt.getTime())
        });
    });


    describe("create tests", () => {

        it("should create a goal", async () => {
            const data = makeGoal({ userId: user.id });

            const created = await goalRepository.create(data);

            expect(created).not.toBeNull();
            expect(created.id).toBeDefined();
            expect(created.userId).toBe(user.id);

            const goalInDb = await prismaTests.goal.findUnique({
                where: { id: created.id },
            });

            expect(goalInDb).not.toBeNull();
            expect(goalInDb?.id).toBe(created.id);
        });

        it("should throw if user does not exist", async () => {
            const data = makeGoal({ userId: "fake-id" });

            await expect(goalRepository.create(data)).rejects.toThrow();
        });

        it("should not allow duplicate title for the same user", async () => {
            const data = makeGoal({ userId: user.id, title: "My Goal" });

            await goalRepository.create(data);

            await expect(goalRepository.create(data)).rejects.toThrow();
        });
        it("should allow same title for different users", async () => {
            const user2 = await userRepository.create(makeUser());

            await goalRepository.create(makeGoal({ userId: user.id, title: "My Goal" }));

            await expect(
                goalRepository.create(makeGoal({ userId: user2.id, title: "My Goal" }))
            ).resolves.not.toThrow();
        });

        it("should create a goal with courseId", async () => {
            const course = await courseRepository.create(makeCourse({ userId: user.id }));

            const created = await goalRepository.create(
                makeGoal({ userId: user.id, courseId: course.id })
            );

            expect(created.courseId).toBe(course.id);
        });

        it("should create a goal with moduleId", async () => {
            const course = await courseRepository.create(makeCourse({ userId: user.id }));
            const module = await prismaTests.module.create({
                data: makeModule({ courseId: course.id }),
            });

            const created = await goalRepository.create(
                makeGoal({ userId: user.id, moduleId: module.id })
            );

            expect(created.moduleId).toBe(module.id);
        });

        it("should create a goal with disciplineId", async () => {
            const course = await courseRepository.create(makeCourse({ userId: user.id }));
            const module = await prismaTests.module.create({
                data: makeModule({ courseId: course.id }),
            });
            const discipline = await prismaTests.discipline.create({
                data: makeDiscipline({ moduleId: module.id }),
            });

            const created = await goalRepository.create(
                makeGoal({ userId: user.id, disciplineId: discipline.id })
            );

            expect(created.disciplineId).toBe(discipline.id);
        });
    });


    describe("update tests", () => {
        it("should update a goal title successfully", async () => {
            const updated = await goalRepository.update(goal.id, { title: "Updated title" });

            expect(updated.title).toBe("Updated title");

            const goalInDb = await prismaTests.goal.findUnique({
                where: { id: goal.id },
            });

            expect(goalInDb?.title).toBe("Updated title");
        });

        it("should update targetMinutes successfully", async () => {
            const updated = await goalRepository.update(goal.id, { targetMinutes: 30 });

            expect(updated.targetMinutes).toBe(30);
        });

        it("should update endDate successfully", async () => {
            const newEndDate = new Date("2026-12-31");

            const updated = await goalRepository.update(goal.id, { endDate: newEndDate });

            expect(updated.endDate).toEqual(newEndDate);
        });

        it("should set endDate to null", async () => {
            const updated = await goalRepository.update(goal.id, { endDate: null });

            expect(updated.endDate).toBeNull();
        });

        it("should throw if goal does not exist", async () => {
            await expect(
                goalRepository.update("fake-id", { title: "New title" })
            ).rejects.toThrow();
        });

        it("should not allow duplicate title for the same user", async () => {
            await prismaTests.goal.create({
                data: makeGoal({ userId: user.id, title: "Existing title" }),
            });

            await expect(
                goalRepository.update(goal.id, { title: "Existing title" })
            ).rejects.toThrow();
        });
    });

    describe("delete tests", () => {
        it("should delete a goal", async () => {
            await goalRepository.delete(goal.id);

            const goalInDb = await prismaTests.goal.findUnique({
                where: { id: goal.id },
            });

            expect(goalInDb).toBeNull();
        });

        it("should not throw if goal does not exist", async () => {
            await expect(goalRepository.delete("fake-id")).resolves.not.toThrow();
        });
    });

    describe("deleteAllByUserId tests", () => {
    it("should delete all goals of a user", async () => {
        await prismaTests.goal.create({
            data: makeGoal({ userId: user.id }),
        });

        await goalRepository.deleteAllByUserId(user.id);

        const goals = await prismaTests.goal.findMany({
            where: { userId: user.id },
        });

        expect(goals).toHaveLength(0);
    });

    it("should not delete goals from another user", async () => {
        const user2 = await userRepository.create(makeUser());
        await prismaTests.goal.create({
            data: makeGoal({ userId: user2.id }),
        });

        await goalRepository.deleteAllByUserId(user.id);

        const goals = await prismaTests.goal.findMany({
            where: { userId: user2.id },
        });

        expect(goals).toHaveLength(1);
    });

    it("should not throw if user has no goals", async () => {
        await expect(
            goalRepository.deleteAllByUserId("fake-id")
        ).resolves.not.toThrow();
    });
});

    describe("deleteAllByCourseIds tests", () => {
        it("should delete all goals linked to given course ids", async () => {
            const course = await courseRepository.create(makeCourse({ userId: user.id }));
            const course2 = await courseRepository.create(makeCourse({ userId: user.id }));

            await prismaTests.goal.create({
                data: makeGoal({ userId: user.id, courseId: course.id }),
            });
            await prismaTests.goal.create({
                data: makeGoal({ userId: user.id, courseId: course2.id }),
            });

            await goalRepository.deleteAllByCourseIds([course.id]);

            const goalsFromCourse1 = await prismaTests.goal.findMany({
                where: { courseId: course.id },
            });
            const goalsFromCourse2 = await prismaTests.goal.findMany({
                where: { courseId: course2.id },
            });

            expect(goalsFromCourse1).toHaveLength(0);
            expect(goalsFromCourse2).toHaveLength(1);
        });

        it("should not throw if courseIds array is empty", async () => {
            await expect(
                goalRepository.deleteAllByCourseIds([])
            ).resolves.not.toThrow();
        });
    });

    describe("deleteAllByModuleIds tests", () => {
        it("should delete all goals linked to given module ids", async () => {
            const course = await courseRepository.create(makeCourse({ userId: user.id }));
            const module = await prismaTests.module.create({
                data: makeModule({ courseId: course.id }),
            });
            const module2 = await prismaTests.module.create({
                data: makeModule({ courseId: course.id }),
            });

            await prismaTests.goal.create({
                data: makeGoal({ userId: user.id, moduleId: module.id }),
            });
            await prismaTests.goal.create({
                data: makeGoal({ userId: user.id, moduleId: module2.id }),
            });

            await goalRepository.deleteAllByModuleIds([module.id]);

            const goalsFromModule1 = await prismaTests.goal.findMany({
                where: { moduleId: module.id },
            });
            const goalsFromModule2 = await prismaTests.goal.findMany({
                where: { moduleId: module2.id },
            });

            expect(goalsFromModule1).toHaveLength(0);
            expect(goalsFromModule2).toHaveLength(1);
        });

        it("should not throw if moduleIds array is empty", async () => {
            await expect(
                goalRepository.deleteAllByModuleIds([])
            ).resolves.not.toThrow();
        });
    });

    describe("deleteAllByDisciplineIds tests", () => {
        it("should delete all goals linked to given discipline ids", async () => {
            const course = await courseRepository.create(makeCourse({ userId: user.id }));
            const module = await prismaTests.module.create({
                data: makeModule({ courseId: course.id }),
            });
            const discipline = await prismaTests.discipline.create({
                data: makeDiscipline({ moduleId: module.id }),
            });
            const discipline2 = await prismaTests.discipline.create({
                data: makeDiscipline({ moduleId: module.id }),
            });

            await prismaTests.goal.create({
                data: makeGoal({ userId: user.id, disciplineId: discipline.id }),
            });
            await prismaTests.goal.create({
                data: makeGoal({ userId: user.id, disciplineId: discipline2.id }),
            });

            await goalRepository.deleteAllByDisciplineIds([discipline.id]);

            const goalsFromDiscipline1 = await prismaTests.goal.findMany({
                where: { disciplineId: discipline.id },
            });
            const goalsFromDiscipline2 = await prismaTests.goal.findMany({
                where: { disciplineId: discipline2.id },
            });

            expect(goalsFromDiscipline1).toHaveLength(0);
            expect(goalsFromDiscipline2).toHaveLength(1);
        });

        it("should not throw if disciplineIds array is empty", async () => {
            await expect(
                goalRepository.deleteAllByDisciplineIds([])
            ).resolves.not.toThrow();
        });
    });

})