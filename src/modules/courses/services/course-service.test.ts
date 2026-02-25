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

    sanitizeMock.sanitizeName.mockImplementation(((value) => value.toUpperCase().trim()))
    sanitizeMock.sanitizeUsername.mockImplementation(((value) => value.toLowerCase().trim()))

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
    })
})