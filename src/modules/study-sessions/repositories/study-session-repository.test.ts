import type { StudySession, User } from "@prisma/client";
import { prismaTests } from "../../../lib/prisma-tests";
import { makeStudySession } from "../../../tests/factories/make-study-session";
import { makeUser } from "../../../tests/factories/make-user";
import { makeCourse } from "../../../tests/factories/make-course";
import { makeModule } from "../../../tests/factories/make-module";
import { makeDiscipline } from "../../../tests/factories/make-discipline";
import { UserRepository } from "../../users/repositories/user.repository";
import { CourseRepository } from "../../courses/repositories/course.repository";
import { ModuleRepository } from "../../modules/repositories/module.repository";
import { StudySessionRepository } from "./study-session.repository";

describe("StudySessionRepository", () => {
    const moduleRepository = new ModuleRepository(prismaTests);
    const userRepository = new UserRepository(prismaTests);
    const courseRepository = new CourseRepository(prismaTests, moduleRepository);
    const studySessionRepository = new StudySessionRepository(prismaTests);

    let user: User;
    let studySession: StudySession;

    beforeAll(async () => {
        await prismaTests.$connect();
    });

    afterAll(async () => {
        await prismaTests.$disconnect();
    });

    beforeEach(async () => {
        user = await userRepository.create(makeUser());

        studySession = await prismaTests.studySession.create({
            data: makeStudySession({
                userId: user.id,
                courseId: null,
                moduleId: null,
                disciplineId: null,
            }),
        });
    });

    afterEach(async () => {
        await prismaTests.studySession.deleteMany();
        await prismaTests.discipline.deleteMany();
        await prismaTests.module.deleteMany();
        await prismaTests.course.deleteMany();
        await prismaTests.user.deleteMany();
    });

    describe("findActiveByUser", () => {

                beforeEach(async () => {
        user = await userRepository.create(makeUser());
    });

            it("should ignore COMPLETED sessions", async () => {

                await prismaTests.studySession.create({
                    data: {
                        userId: user.id,
                        minutes: 50,
                        status: "COMPLETED",
                        studiedAt: new Date(),
                        startedAt: new Date()
                    }
                })

                const result = await studySessionRepository.findActiveByUser(user.id)

                expect(result).toHaveLength(0)
            })
            it("should return sessions ordered by createdAt desc", async () => {
                const older = await prismaTests.studySession.create({
                    data: {
                        userId: user.id,
                        minutes: 0,
                        status: "IN_PROGRESS",
                        studiedAt: new Date(),
                        createdAt: new Date(Date.now() - 10000),
                        startedAt: new Date()
                    }
                })

                const newer = await prismaTests.studySession.create({
                    data: {
                        userId: user.id,
                        minutes: 0,
                        status: "IN_PROGRESS",
                        studiedAt: new Date(),
                        createdAt: new Date(),
                        startedAt: new Date()
                    }
                })

                const result = await studySessionRepository.findActiveByUser(user.id)

                expect(result[0]?.id).toBe(newer.id)
                expect(result[1]?.id).toBe(older.id)
            })

            it("should return multiple active sessions if they exist", async () => {
                await prismaTests.studySession.createMany({
                    data: [
                        {
                            userId: user.id,
                            minutes: 0,
                            status: "IN_PROGRESS",
                            studiedAt: new Date(),
                            startedAt: new Date()
                        },
                        {
                            userId: user.id,
                            minutes: 0,
                            status: "IN_PROGRESS",
                            studiedAt: new Date(),
                            startedAt: new Date()
                        }
                    ]
                })

                const result = await studySessionRepository.findActiveByUser(user.id)

                expect(result).toHaveLength(2)
            })

            it("should return empty array when no active sessions exist", async () => {

                const result = await studySessionRepository.findActiveByUser(user.id)

                expect(result).toEqual([])
            })

            it("should not return sessions from other users", async () => {
                const otherUserId = (await prismaTests.user.create({data: makeUser()})).id

                await prismaTests.studySession.create({
                    data: {
                        userId: otherUserId,
                        minutes: 0,
                        status: "IN_PROGRESS",
                        studiedAt: new Date(),
                        startedAt: new Date()
                    }
                })

                const result = await studySessionRepository.findActiveByUser(user.id)

                expect(result).toHaveLength(0)
            })

            it("should return only IN_PROGRESS sessions for the user", async () => {
                const userId = user.id

                const activeSession = await prismaTests.studySession.create({
                    data: {
                        userId,
                        minutes: 0,
                        status: "IN_PROGRESS",
                        studiedAt: new Date(),
                        startedAt: new Date()
                    }
                })

                await prismaTests.studySession.create({
                    data: {
                        userId,
                        minutes: 60,
                        status: "COMPLETED",
                        studiedAt: new Date(),
                        startedAt: new Date()
                    }
                })

                const result = await studySessionRepository.findActiveByUser(userId)

                expect(result).toHaveLength(1)
                expect(result[0]?.id).toBe(activeSession.id)
            })

    })


    describe("findById", () => {
        it("should find a study session by id", async () => {
            const found = await studySessionRepository.findById(studySession.id);

            expect(found).not.toBeNull();
            expect(found).toEqual(studySession);
        });

        it("should return null when not found", async () => {
            const found = await studySessionRepository.findById("fake-id");

            expect(found).toBeNull();
        });
    });

    describe("findByIdWithOwner", () => {
        it("should find study session with owner", async () => {
            const found = await studySessionRepository.findByIdWithOwner(
                studySession.id,
                user.id
            );

            expect(found).not.toBeNull();
            expect(found).toEqual(studySession);
        });

        it("should return null if belongs to another user", async () => {
            const user2 = await userRepository.create(makeUser());

            const found = await studySessionRepository.findByIdWithOwner(
                studySession.id,
                user2.id
            );

            expect(found).toBeNull();
        });
    });

    describe("findAllByUserId", () => {
        it("should return all sessions of user only", async () => {
            await prismaTests.studySession.create({
                data: makeStudySession({ userId: user.id }),
            });

            const user2 = await userRepository.create(makeUser());

            await prismaTests.studySession.create({
                data: makeStudySession({ userId: user2.id }),
            });

            const found = await studySessionRepository.findAllByUserId(user.id);

            expect(found).toHaveLength(2);
            expect(found.every(s => s.userId === user.id)).toBe(true);
        });

        it("should return ordered by createdAt desc", async () => {
            await prismaTests.studySession.create({
                data: makeStudySession({ userId: user.id }),
            });

            const found = await studySessionRepository.findAllByUserId(user.id);

            const sorted = [...found].sort(
                (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
            );

            expect(found).toEqual(sorted);
        });
    });


    describe("create", () => {
        it("should create with minimal valid data", async () => {
            const created = await studySessionRepository.create(
                makeStudySession({
                    userId: user.id,
                    courseId: null,
                    moduleId: null,
                    disciplineId: null,
                })
            );

            expect(created.id).toBeDefined();
            expect(created.userId).toBe(user.id);
        });

        it("should throw if user does not exist", async () => {
            await expect(
                studySessionRepository.create(
                    makeStudySession({
                        userId: "fake-id",
                    })
                )
            ).rejects.toThrow();
        });

        it("should create with course relation", async () => {
            const course = await courseRepository.create(
                makeCourse({ userId: user.id })
            );

            const created = await studySessionRepository.create(
                makeStudySession({
                    userId: user.id,
                    courseId: course.id,
                })
            );

            expect(created.courseId).toBe(course.id);
        });

        it("should create with module relation", async () => {
            const course = await courseRepository.create(
                makeCourse({ userId: user.id })
            );

            const module = await prismaTests.module.create({
                data: makeModule({ courseId: course.id }),
            });

            const created = await studySessionRepository.create(
                makeStudySession({
                    userId: user.id,
                    moduleId: module.id,
                })
            );

            expect(created.moduleId).toBe(module.id);
        });

        it("should create with discipline relation", async () => {
            const course = await courseRepository.create(
                makeCourse({ userId: user.id })
            );

            const module = await prismaTests.module.create({
                data: makeModule({ courseId: course.id }),
            });

            const discipline = await prismaTests.discipline.create({
                data: makeDiscipline({ moduleId: module.id }),
            });

            const created = await studySessionRepository.create(
                makeStudySession({
                    userId: user.id,
                    disciplineId: discipline.id,
                })
            );

            expect(created.disciplineId).toBe(discipline.id);
        });

        it("should accept null relations explicitly", async () => {
            const created = await studySessionRepository.create(
                makeStudySession({
                    userId: user.id,
                    courseId: null,
                    moduleId: null,
                    disciplineId: null,
                })
            );

            expect(created.courseId).toBeNull();
            expect(created.moduleId).toBeNull();
            expect(created.disciplineId).toBeNull();
        });
    });


    describe("update", () => {

        it("should update studiedAt only", async () => {
            const newDate = new Date("2025-01-01");

            const updated = await studySessionRepository.update(studySession.id, {
                studiedAt: newDate,
            });

            expect(updated.studiedAt).toEqual(newDate);
        });

        it("should not change anything with empty update", async () => {
            const updated = await studySessionRepository.update(studySession.id, {});

            expect(updated).toEqual(studySession);
        });

        it("should throw if not found", async () => {
            await expect(
                studySessionRepository.update("fake-id", { status: 'COMPLETED' })
            ).rejects.toThrow();
        });
    });


    describe("delete", () => {
        it("should delete a session", async () => {
            await studySessionRepository.delete(studySession.id);

            const found = await prismaTests.studySession.findUnique({
                where: { id: studySession.id },
            });

            expect(found).toBeNull();
        });

        it("should be idempotent", async () => {
            await expect(
                studySessionRepository.delete("fake-id")
            ).resolves.not.toThrow();
        });
    });


    describe("deleteAllByUserId", () => {
        it("should delete only sessions from given user", async () => {
            const user2 = await userRepository.create(makeUser());

            await prismaTests.studySession.create({
                data: makeStudySession({ userId: user2.id }),
            });

            await studySessionRepository.deleteAllByUserId(user.id);

            const remaining = await prismaTests.studySession.findMany();

            expect(remaining.every(s => s.userId !== user.id)).toBe(true);
        });

        it("should not throw if user has no sessions", async () => {
            await expect(
                studySessionRepository.deleteAllByUserId("fake-id")
            ).resolves.not.toThrow();
        });
    });

});