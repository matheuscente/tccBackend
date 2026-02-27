import { AuthorizationError } from "../../../shared/errors/authorization.error"
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

    const adminAuthUser: AuthUserDTO = {
        id: "1",
        role: "ADMIN"
    }

    const userAuthUser: AuthUserDTO = {
        id: "2",
        role: "USER"
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

            const course = makeCourse({ userId: "2" })

            courseRepositoryMock.findById.mockResolvedValue(course)

            const findedCourse = await service.findById(adminAuthUser, course.id)

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
            const course = makeCourse({ userId: userAuthUser.id })

            courseRepositoryMock.findOwnedById.mockResolvedValue(course)

            const findedCourse = await service.findById(userAuthUser, course.id)

            expect(findedCourse).toEqual({
                id: course.id,
                title: course.title,
                createdAt: course.createdAt.toISOString(),
                updatedAt: course.updatedAt.toISOString(),
                description: course.description
            })
            expect(courseRepositoryMock.findById).not.toHaveBeenCalled()

            expect(courseRepositoryMock.findOwnedById).toHaveBeenCalled()
            expect(courseRepositoryMock.findOwnedById).toHaveBeenCalledWith(course.id, userAuthUser.id)
        })

        it("should return null because admin does not have a course with the given ID.", async () => {

            courseRepositoryMock.findById.mockResolvedValue(null)

            const findedCourse = await service.findById(adminAuthUser, "fakeId")

            expect(findedCourse).toBe(null)
            expect(courseRepositoryMock.findById).toHaveBeenCalledTimes(1)
            expect(courseRepositoryMock.findById).toHaveBeenCalledWith("fakeId")
            expect(courseRepositoryMock.findOwnedById).not.toHaveBeenCalled()
        })

        it("should return null because user does not have a course with the given ID.", async () => {

            courseRepositoryMock.findOwnedById.mockResolvedValue(null)

            const findedCourse = await service.findById(userAuthUser, "fakeId")

            expect(findedCourse).toBe(null)
            expect(courseRepositoryMock.findById).not.toHaveBeenCalled()

            expect(courseRepositoryMock.findOwnedById).toHaveBeenCalled()
            expect(courseRepositoryMock.findOwnedById).toHaveBeenCalledWith("fakeId", userAuthUser.id)
        })

        it("should propagate a findById dependency error", async () => {
            const authUser: AuthUserDTO = {
                id: "1",
                role: "ADMIN"
            }
            const course = makeCourse()

            courseRepositoryMock.findById.mockRejectedValue(new Error())

            const findedCourse = service.findById(authUser, course.id)

            await expect(findedCourse).rejects.toBeInstanceOf(Error)
            expect(courseRepositoryMock.findById).toHaveBeenCalledTimes(1)
            expect(courseRepositoryMock.findById).toHaveBeenCalledWith(course.id)
            expect(courseRepositoryMock.findOwnedById).not.toHaveBeenCalled()
        })

        it("should propagate a findByOwnedId dependency error", async () => {

            const course = makeCourse({ userId: userAuthUser.id })

            courseRepositoryMock.findOwnedById.mockRejectedValue(new Error)

            const findedCourse = service.findById(userAuthUser, course.id)

            await expect(findedCourse).rejects.toBeInstanceOf(Error)
            expect(courseRepositoryMock.findById).not.toHaveBeenCalled()

            expect(courseRepositoryMock.findOwnedById).toHaveBeenCalled()
            expect(courseRepositoryMock.findOwnedById).toHaveBeenCalledWith(course.id, userAuthUser.id)
        })
    })

    describe("findAllByUserId tests", () => {
        it("should return all courses for a specified user", async () => {

            const course1 = makeCourse({ userId: userAuthUser.id })
            const course2 = makeCourse({ userId: userAuthUser.id })

            courseRepositoryMock.findAllByUserId.mockResolvedValue([course1, course2])

            const courses = await service.findAllByUserId(userAuthUser, userAuthUser.id)

            const expectedCourses = [course1, course2].map(course => ({
                id: course.id,
                title: course.title,
                description: course.description,
                createdAt: course.createdAt.toISOString(),
                updatedAt: course.updatedAt.toISOString()
            }))

            expect(courses).toEqual(expectedCourses)
            expect(courseRepositoryMock.findAllByUserId).toHaveBeenCalledTimes(1)
            expect(courseRepositoryMock.findAllByUserId).toHaveBeenCalledWith(userAuthUser.id)
        })


        it("should return a courses empty array for a specified user", async () => {

            courseRepositoryMock.findAllByUserId.mockResolvedValue([])

            const courses = await service.findAllByUserId(userAuthUser, userAuthUser.id)

            expect(courses).toHaveLength(0)
            expect(courseRepositoryMock.findAllByUserId).toHaveBeenCalledTimes(1)
            expect(courseRepositoryMock.findAllByUserId).toHaveBeenCalledWith(userAuthUser.id)
        })


        it("should throw an authorization error when the USER rule attempts to search for another user's course.", async () => {

            const courses = service.findAllByUserId(userAuthUser, "3")

            await expect(courses).rejects.toThrow("Ação não autorizada")
            await expect(courses).rejects.toBeInstanceOf(AuthorizationError)
            expect(courseRepositoryMock.findAllByUserId).not.toHaveBeenCalled()
        })

        it("should propagate a findAllByUserId dependency error", async () => {


            courseRepositoryMock.findAllByUserId.mockRejectedValue(new Error())

            const courses = service.findAllByUserId(userAuthUser, userAuthUser.id)


            await expect(courses).rejects.toBeInstanceOf(Error)
            expect(courseRepositoryMock.findAllByUserId).toHaveBeenCalledTimes(1)
            expect(courseRepositoryMock.findAllByUserId).toHaveBeenCalledWith(userAuthUser.id)
        })

        it("should allow ADMIN to access another user's courses", async () => {

            const course = makeCourse({ userId: adminAuthUser.id })

            courseRepositoryMock.findAllByUserId.mockResolvedValue([course])

            const result = await service.findAllByUserId(adminAuthUser, "1")

            expect(courseRepositoryMock.findAllByUserId)
                .toHaveBeenCalledWith("1")

            expect(result).toEqual([
                {
                    id: course.id,
                    title: course.title,
                    description: course.description,
                    createdAt: course.createdAt.toISOString(),
                    updatedAt: course.updatedAt.toISOString()
                }
            ])

        })

    })


    describe("softdelete tests", () => {
        it("should soft delete a course sucessfully", async () => {
            const course = makeCourse({ userId: userAuthUser.id })

            courseRepositoryMock.findById.mockResolvedValue(course)
            courseRepositoryMock.softDelete.mockResolvedValue(undefined)

            const softDeletedCourse = await service.softDelete(userAuthUser, course.id)

            expect(softDeletedCourse).toBe(undefined)

            expect(courseRepositoryMock.findById).toHaveBeenCalledTimes(1)
            expect(courseRepositoryMock.findById).toHaveBeenCalledWith(course.id)

            expect(courseRepositoryMock.softDelete).toHaveBeenCalledTimes(1)
            expect(courseRepositoryMock.softDelete).toHaveBeenCalledWith(course.id, course.userId)

        })

        it("administrator should be able to delete another user's course", async () => {
            const course = makeCourse({ userId: "2" })

            courseRepositoryMock.findById.mockResolvedValue(course)
            courseRepositoryMock.softDelete.mockResolvedValue(undefined)

            const softDeletedCourse = await service.softDelete(adminAuthUser, course.id)

            expect(softDeletedCourse).toBe(undefined)

            expect(courseRepositoryMock.findById).toHaveBeenCalledTimes(1)
            expect(courseRepositoryMock.findById).toHaveBeenCalledWith(course.id)

            expect(courseRepositoryMock.softDelete).toHaveBeenCalledTimes(1)
            expect(courseRepositoryMock.softDelete).toHaveBeenCalledWith(course.id, course.userId)

        })

        it("should throw an authorization error because a regular user tried to delete another user's course", async () => {
            const course = makeCourse({ userId: "3" })

            courseRepositoryMock.findById.mockResolvedValue(course)

            const softDeletedCourse = service.softDelete(userAuthUser, course.id)

            await expect(softDeletedCourse).rejects.toThrow("Ação não autorizada")
            await expect(softDeletedCourse).rejects.toBeInstanceOf(AuthorizationError)

            expect(courseRepositoryMock.findById).toHaveBeenCalledTimes(1)
            expect(courseRepositoryMock.findById).toHaveBeenCalledWith(course.id)

            expect(courseRepositoryMock.softDelete).not.toHaveBeenCalled()

        })

        it("should propagate a findById dependency error.", async () => {
            courseRepositoryMock.findById.mockRejectedValue(new Error())

            const softDeletedCourse = service.softDelete(userAuthUser, "1")

            await expect(softDeletedCourse).rejects.toBeInstanceOf(Error)

            expect(courseRepositoryMock.findById).toHaveBeenCalledTimes(1)
            expect(courseRepositoryMock.findById).toHaveBeenCalledWith("1")

            expect(courseRepositoryMock.softDelete).not.toHaveBeenCalled()

        })

        it("should propagatse a softDelete dependency error.", async () => {
            const course = makeCourse({ userId: "3" })

            courseRepositoryMock.findById.mockResolvedValue(course)
            courseRepositoryMock.softDelete.mockRejectedValue(new Error())

            const softDeletedCourse = service.softDelete(adminAuthUser, course.id)

            await expect(softDeletedCourse).rejects.toBeInstanceOf(Error)

            expect(courseRepositoryMock.findById).toHaveBeenCalledTimes(1)
            expect(courseRepositoryMock.findById).toHaveBeenCalledWith(course.id)

            expect(courseRepositoryMock.softDelete).toHaveBeenCalledTimes(1)
            expect(courseRepositoryMock.softDelete).toHaveBeenCalledWith(course.id, course.userId)

        })

        it("Nothing should be returned because the course no longer exists.", async () => {


            courseRepositoryMock.findById.mockResolvedValue(null)

            const softDeletedCourse = await service.softDelete(userAuthUser, "3")

            expect(softDeletedCourse).toBe(undefined)

            expect(courseRepositoryMock.findById).toHaveBeenCalledTimes(1)
            expect(courseRepositoryMock.findById).toHaveBeenCalledWith("3")

            expect(courseRepositoryMock.softDelete).not.toHaveBeenCalled()

        })
    })

})

