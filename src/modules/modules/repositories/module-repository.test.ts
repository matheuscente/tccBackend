import type { Course, Module, User } from "@prisma/client"
import { prismaTests } from "../../../lib/prisma-tests"
import { makeModule } from "../../../shared/make-module"
import { makeCourse } from "../../../tests/factories/make-course"
import { makeUser } from "../../../tests/factories/make-user"
import { CourseRepository } from "../../courses/repositories/course.repository"
import { UserRepository } from "../../users/repositories/user.repository"
import { ModuleRepository } from "./module.repository"
import { exec } from "node:child_process"

describe("module repository tests", () => {
    const moduleRepository = new ModuleRepository(prismaTests)
    const userRepository = new UserRepository(prismaTests)
    const courseRepository = new CourseRepository(prismaTests, moduleRepository)

    let user: User, module: Module, course: Course;

    beforeAll(async () => {
        await prismaTests.$connect()
    })

    afterAll(async () => {
        await prismaTests.$disconnect()
    })

    beforeEach(async () => {
        user = await userRepository.create(makeUser())
        course = await courseRepository.create(makeCourse({ userId: user.id }))
        module = await prismaTests.module.create({
            data: makeModule(
                { courseId: course.id }
            )
        }
        )
    })

    afterEach(async () => {
        await prismaTests.course.deleteMany()
        await prismaTests.user.deleteMany()
        await prismaTests.module.deleteMany()
    })

    describe("findAllByCourseId tests", () => {
        it("should look for all the modules in a course.", async () => {
            const course2 = await courseRepository.create(makeCourse({userId: user.id}))
            await prismaTests.module.create({data: makeModule({courseId: course2.id})})

            await prismaTests.module.create({data: makeModule({courseId: course.id})})

            const findedModules = await moduleRepository.findAllByCourseId(course.id)

            expect(findedModules).toHaveLength(2)
            expect(findedModules[0]?.courseId).toBe(course.id)
            expect(findedModules[1]?.courseId).toBe(course.id)
        })

        it("should return an empty array because there is no module in the course with the given ID", async () => {
            const course2 = await courseRepository.create(makeCourse({userId: user.id}))

            const findedModules = await moduleRepository.findAllByCourseId(course2.id)

            expect(findedModules).toHaveLength(0)
        })
    })

    describe("findById tests", () => {
        it("should only search for the requested module.", async () => {
            const findedModule = await moduleRepository.findById(module.id)

            expect(findedModule).not.toBeNull()
            expect(findedModule).toEqual(module)
        })

        it("It should return null because there is no module with the given ID.", async () => {
            const findedModule = await moduleRepository.findById("fake-id")

            expect(findedModule).toBeNull()
        })
    
    })
})