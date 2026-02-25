import type { Isanitize } from "../../../shared/sanitize/interfaces/sanitize.interface"
import { makeCourse } from "../../../tests/factories/make-course"
import type { IUserRepository } from "../../users/interfaces/user-repository.interface"
import type { AuthUserDTO } from "../DTOs/auth-user.DTO"
import type { ICourseRepository } from "../interfaces/repository/course-repository.interface"
import { CourseService } from "./course.service"

describe("course service tests", () => {
    const courseRepositoryMock: jest.Mocked<ICourseRepository> = {
        create: jest.fn(),
        findById: jest.fn(),
        findOwnedById: jest.fn(),
        findAllByUserId: jest.fn(),
        update: jest.fn(),
        softDelete: jest.fn()
    }

    const userRepositoryMock: jest.Mocked<IUserRepository> = {
        create: jest.fn(),
        findById: jest.fn(),
        findByUsername: jest.fn(),
        update: jest.fn(),
        updatePassword: jest.fn(),
        softDelete: jest.fn()
    }

    const sanitizeMock: jest.Mocked<Isanitize> = {
        removeAccents: jest.fn(),
        sanitizeName: jest.fn(),
        sanitizeUsername: jest.fn()
    }

    const service = new CourseService(courseRepositoryMock, userRepositoryMock, sanitizeMock)

    beforeEach(() => {
        jest.resetAllMocks()
        sanitizeMock.sanitizeName.mockImplementation(
            (value) => value.toUpperCase().trim()
        )

        sanitizeMock.sanitizeUsername.mockImplementation(
            (value) => value.toLowerCase().trim()
        )
    })

    describe("findById tests", () => {
        it("should find a course with role admin successfully", async () => {
            const user: AuthUserDTO = {
                id: "1",
                role: "ADMIN"
            }
            const course = makeCourse()

            courseRepositoryMock.findById.mockResolvedValue(course)

            const findedCourse = await service.findById(user, course.id)

            expect(findedCourse).toEqual({
                id: course.id,
                title: course.title,
                createdAt: course.createdAt.toISOString(),
                updatedAt: course.updatedAt.toISOString(),
                description: course.description
            })
            expect(courseRepositoryMock.findById).toHaveBeenCalledTimes(1)
            expect(courseRepositoryMock.findById).toHaveBeenCalledWith(course.id)
            expect(courseRepositoryMock.findOwnedById).not.toHaveBeenCalled()
        })

        it("should find a course with role user successfully", async () => {
            const id = "1"
            const user: AuthUserDTO = {
                id,
                role: "USER"
            }
            const course = makeCourse({ userId: id })

            courseRepositoryMock.findOwnedById.mockResolvedValue(course)

            const findedCourse = await service.findById(user, course.id)

            expect(findedCourse).toEqual({
                id: course.id,
                title: course.title,
                createdAt: course.createdAt.toISOString(),
                updatedAt: course.updatedAt.toISOString(),
                description: course.description
            })
            expect(courseRepositoryMock.findById).not.toHaveBeenCalled()

            expect(courseRepositoryMock.findOwnedById).toHaveBeenCalled()
            expect(courseRepositoryMock.findOwnedById).toHaveBeenCalledWith(course.id, user.id)
        })

        it("should return null because admin does not have a course with the given ID.", async () => {
            const user: AuthUserDTO = {
                id: "1",
                role: "ADMIN"
            }
            const course = makeCourse()

            courseRepositoryMock.findById.mockResolvedValue(null)

            const findedCourse = await service.findById(user, course.id)

            expect(findedCourse).toBe(null)
            expect(courseRepositoryMock.findById).toHaveBeenCalledTimes(1)
            expect(courseRepositoryMock.findById).toHaveBeenCalledWith(course.id)
            expect(courseRepositoryMock.findOwnedById).not.toHaveBeenCalled()
        })

        it("should return null because user does not have a course with the given ID.", async () => {

            const id = "1"
            const user: AuthUserDTO = {
                id,
                role: "USER"
            }
            const course = makeCourse({ userId: id })

            courseRepositoryMock.findOwnedById.mockResolvedValue(null)

            const findedCourse = await service.findById(user, course.id)

            expect(findedCourse).toBe(null)
            expect(courseRepositoryMock.findById).not.toHaveBeenCalled()

            expect(courseRepositoryMock.findOwnedById).toHaveBeenCalled()
            expect(courseRepositoryMock.findOwnedById).toHaveBeenCalledWith(course.id, user.id)
        })

        it("should propagate a findById dependency error", async () => {
            const user: AuthUserDTO = {
                id: "1",
                role: "ADMIN"
            }
            const course = makeCourse()

            courseRepositoryMock.findById.mockRejectedValue(new Error())

            const findedCourse = service.findById(user, course.id)

            await expect(findedCourse).rejects.toBeInstanceOf(Error)
            expect(courseRepositoryMock.findById).toHaveBeenCalledTimes(1)
            expect(courseRepositoryMock.findById).toHaveBeenCalledWith(course.id)
            expect(courseRepositoryMock.findOwnedById).not.toHaveBeenCalled()
        })

        it("should propagate a findByOwnedId dependency error", async () => {
            const id = "1"
            const user: AuthUserDTO = {
                id,
                role: "USER"
            }
            const course = makeCourse({ userId: id })

            courseRepositoryMock.findOwnedById.mockRejectedValue(new Error)

            const findedCourse = service.findById(user, course.id)

            await expect(findedCourse).rejects.toBeInstanceOf(Error)
            expect(courseRepositoryMock.findById).not.toHaveBeenCalled()

            expect(courseRepositoryMock.findOwnedById).toHaveBeenCalled()
            expect(courseRepositoryMock.findOwnedById).toHaveBeenCalledWith(course.id, user.id)
        })
    })

    describe("findAllByUserId tests", () => {
        it("should return all courses for a specified user", async () => {
    const id = "1"
    const user: AuthUserDTO = { id, role: "USER" }

    const course1 = makeCourse({ userId: user.id })
    const course2 = makeCourse({ userId: user.id })

    courseRepositoryMock.findAllByUserId.mockResolvedValue([course1, course2])

    const courses = await service.findAllByUserId(user, user.id)

    const expectedCourses = [course1, course2].map(course => ({
        id: course.id,
        title: course.title,
        description: course.description,
        createdAt: course.createdAt.toISOString(),
        updatedAt: course.updatedAt.toISOString()
    }))

    expect(courses).toEqual(expectedCourses)
    expect(courseRepositoryMock.findAllByUserId).toHaveBeenCalledTimes(1)
    expect(courseRepositoryMock.findAllByUserId).toHaveBeenCalledWith(user.id)
})
    })
})
