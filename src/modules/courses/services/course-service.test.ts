import { AuthorizationError } from "../../../shared/errors/authorization.error";
import { NotFoundError } from "../../../shared/errors/not-found-error";
import type { Isanitize } from "../../../shared/sanitize/interfaces/sanitize.interface";
import { makeCourse } from "../../../tests/factories/make-course";
import { makeUser } from "../../../tests/factories/make-user";
import type { IModuleRepository } from "../../modules/interfaces/repositories/module-repository.interface";
import type { ITransaction } from "../../transaction/interfaces/transaction.interface";
import type { IUserRepository } from "../../users/interfaces/user-repository.interface";
import type { AuthUserDTO } from "../DTOs/auth-user.DTO";
import type { CreateCourseDTO } from "../DTOs/create-course.DTO";
import type { ICourseRepository } from "../interfaces/repository/course-repository.interface";
import { CourseService } from "./course.service";

describe("course service tests", () => {
  const courseRepositoryMock: jest.Mocked<ICourseRepository> = {
    create: jest.fn(),
    findById: jest.fn(),
    findOwnedById: jest.fn(),
    findAllByUserId: jest.fn(),
    update: jest.fn(),
    softDelete: jest.fn(),
    softDeleteAllByUserid: jest.fn()
  };

  const userRepositoryMock: jest.Mocked<IUserRepository> = {
    create: jest.fn(),
    findById: jest.fn(),
    findByUsername: jest.fn(),
    update: jest.fn(),
    updatePassword: jest.fn(),
    softDelete: jest.fn(),
  };

  const sanitizeMock: jest.Mocked<Isanitize> = {
    removeAccents: jest.fn(),
    sanitizeName: jest.fn(),
    sanitizeUsername: jest.fn(),
  };

  const moduleRepositoryMock: jest.Mocked<IModuleRepository> = {
    findById: jest.fn(),

    findAllByCourseId: jest.fn(),

    findAllByUserId: jest.fn(),

    create: jest.fn(),

    update: jest.fn(),

    softDeleteById: jest.fn(),

    softDeleteByCourseId: jest.fn(),
  };

  const transactionMock: jest.Mocked<ITransaction> = {
    execute: jest.fn().mockImplementation(async (callback) => {
      return callback({
        moduleRepository: moduleRepositoryMock,
        courseRepository: courseRepositoryMock,
      });
    }),
  };

  const adminAuthUser: AuthUserDTO = {
    id: "1",
    role: "ADMIN",
  };

  const userAuthUser: AuthUserDTO = {
    id: "2",
    role: "USER",
  };

  const service = new CourseService(
    courseRepositoryMock,
    userRepositoryMock,
    sanitizeMock,
    transactionMock,
  );

  beforeEach(() => {
    jest.clearAllMocks();
    sanitizeMock.sanitizeName.mockImplementation((value) =>
      value.toUpperCase().trim(),
    );

    sanitizeMock.sanitizeUsername.mockImplementation((value) =>
      value.toLowerCase().trim(),
    );
  });

  describe("findById tests", () => {
    it("should find a course with role admin successfully", async () => {
      const course = makeCourse({ userId: "2" });

      courseRepositoryMock.findById.mockResolvedValue(course);

      const findedCourse = await service.findById(adminAuthUser, course.id);

      expect(findedCourse).toEqual({
        id: course.id,
        title: course.title,
        createdAt: course.createdAt.toISOString(),
        updatedAt: course.updatedAt.toISOString(),
        description: course.description,
      });

      expect(findedCourse).not.toHaveProperty("deletedAt");
      expect(findedCourse).not.toHaveProperty("userid");
      expect(courseRepositoryMock.findById).toHaveBeenCalledTimes(1);
      expect(courseRepositoryMock.findById).toHaveBeenCalledWith(course.id);
      expect(courseRepositoryMock.findOwnedById).not.toHaveBeenCalled();
    });

    it("should find a course with role user successfully", async () => {
      const course = makeCourse({ userId: userAuthUser.id });

      courseRepositoryMock.findOwnedById.mockResolvedValue(course);

      const findedCourse = await service.findById(userAuthUser, course.id);

      expect(findedCourse).toEqual({
        id: course.id,
        title: course.title,
        createdAt: course.createdAt.toISOString(),
        updatedAt: course.updatedAt.toISOString(),
        description: course.description,
      });
      expect(findedCourse).not.toHaveProperty("deletedAt");
      expect(findedCourse).not.toHaveProperty("userid");
      expect(courseRepositoryMock.findById).not.toHaveBeenCalled();

      expect(courseRepositoryMock.findOwnedById).toHaveBeenCalled();
      expect(courseRepositoryMock.findOwnedById).toHaveBeenCalledWith(
        course.id,
        userAuthUser.id,
      );
    });

    it("should return null because admin does not have a course with the given ID.", async () => {
      courseRepositoryMock.findById.mockResolvedValue(null);

      const findedCourse = await service.findById(adminAuthUser, "fakeId");

      expect(findedCourse).toBe(null);
      expect(courseRepositoryMock.findById).toHaveBeenCalledTimes(1);
      expect(courseRepositoryMock.findById).toHaveBeenCalledWith("fakeId");
      expect(courseRepositoryMock.findOwnedById).not.toHaveBeenCalled();
    });

    it("should return null because user does not have a course with the given ID.", async () => {
      courseRepositoryMock.findOwnedById.mockResolvedValue(null);

      const findedCourse = await service.findById(userAuthUser, "fakeId");

      expect(findedCourse).toBe(null);
      expect(courseRepositoryMock.findById).not.toHaveBeenCalled();

      expect(courseRepositoryMock.findOwnedById).toHaveBeenCalled();
      expect(courseRepositoryMock.findOwnedById).toHaveBeenCalledWith(
        "fakeId",
        userAuthUser.id,
      );
    });

    it("should propagate a findById dependency error", async () => {
      const authUser: AuthUserDTO = {
        id: "1",
        role: "ADMIN",
      };
      const course = makeCourse();

      courseRepositoryMock.findById.mockRejectedValue(new Error());

      const findedCourse = service.findById(authUser, course.id);

      await expect(findedCourse).rejects.toBeInstanceOf(Error);
      expect(courseRepositoryMock.findById).toHaveBeenCalledTimes(1);
      expect(courseRepositoryMock.findById).toHaveBeenCalledWith(course.id);
      expect(courseRepositoryMock.findOwnedById).not.toHaveBeenCalled();
    });

    it("should propagate a findByOwnedId dependency error", async () => {
      const course = makeCourse({ userId: userAuthUser.id });

      courseRepositoryMock.findOwnedById.mockRejectedValue(new Error());

      const findedCourse = service.findById(userAuthUser, course.id);

      await expect(findedCourse).rejects.toBeInstanceOf(Error);
      expect(courseRepositoryMock.findById).not.toHaveBeenCalled();

      expect(courseRepositoryMock.findOwnedById).toHaveBeenCalled();
      expect(courseRepositoryMock.findOwnedById).toHaveBeenCalledWith(
        course.id,
        userAuthUser.id,
      );
    });
  });

  describe("findAllByUserId tests", () => {
    it("should return all courses for a specified user", async () => {
      const course1 = makeCourse({ userId: userAuthUser.id });
      const course2 = makeCourse({ userId: userAuthUser.id });

      courseRepositoryMock.findAllByUserId.mockResolvedValue([
        course1,
        course2,
      ]);

      const courses = await service.findAllByUserId(
        userAuthUser,
        userAuthUser.id,
      );

      const expectedCourses = [course1, course2].map((course) => ({
        id: course.id,
        title: course.title,
        description: course.description,
        createdAt: course.createdAt.toISOString(),
        updatedAt: course.updatedAt.toISOString(),
      }));

      expect(courses).toEqual(expectedCourses);
      expect(courseRepositoryMock.findAllByUserId).toHaveBeenCalledTimes(1);
      expect(courseRepositoryMock.findAllByUserId).toHaveBeenCalledWith(
        userAuthUser.id,
      );
    });

    it("should return a courses empty array for a specified user", async () => {
      courseRepositoryMock.findAllByUserId.mockResolvedValue([]);

      const courses = await service.findAllByUserId(
        userAuthUser,
        userAuthUser.id,
      );

      expect(courses).toHaveLength(0);
      expect(courseRepositoryMock.findAllByUserId).toHaveBeenCalledTimes(1);
      expect(courseRepositoryMock.findAllByUserId).toHaveBeenCalledWith(
        userAuthUser.id,
      );
    });

    it("should throw an authorization error when the USER rule attempts to search for another user's course.", async () => {
      const courses = service.findAllByUserId(userAuthUser, "3");

      await expect(courses).rejects.toThrow("Ação não autorizada");
      await expect(courses).rejects.toBeInstanceOf(AuthorizationError);
      expect(courseRepositoryMock.findAllByUserId).not.toHaveBeenCalled();
    });

    it("should propagate a findAllByUserId dependency error", async () => {
      courseRepositoryMock.findAllByUserId.mockRejectedValue(new Error());

      const courses = service.findAllByUserId(userAuthUser, userAuthUser.id);

      await expect(courses).rejects.toBeInstanceOf(Error);
      expect(courseRepositoryMock.findAllByUserId).toHaveBeenCalledTimes(1);
      expect(courseRepositoryMock.findAllByUserId).toHaveBeenCalledWith(
        userAuthUser.id,
      );
    });

    it("should allow ADMIN to access another user's courses", async () => {
      const course = makeCourse({ userId: adminAuthUser.id });

      courseRepositoryMock.findAllByUserId.mockResolvedValue([course]);

      const result = await service.findAllByUserId(adminAuthUser, "1");

      expect(courseRepositoryMock.findAllByUserId).toHaveBeenCalledWith("1");

      expect(result).toEqual([
        {
          id: course.id,
          title: course.title,
          description: course.description,
          createdAt: course.createdAt.toISOString(),
          updatedAt: course.updatedAt.toISOString(),
        },
      ]);
    });
  });

  describe("softdelete tests", () => {
    it("should soft delete course and its modules inside a transaction", async () => {
      const course = makeCourse({ userId: userAuthUser.id });

      courseRepositoryMock.findById.mockResolvedValue(course);

      await service.softDelete(userAuthUser, course.id);

      expect(transactionMock.execute).toHaveBeenCalledTimes(1);

      expect(courseRepositoryMock.findById).toHaveBeenCalledWith(course.id);

      expect(moduleRepositoryMock.softDeleteByCourseId).toHaveBeenCalledTimes(
        1,
      );
      expect(moduleRepositoryMock.softDeleteByCourseId).toHaveBeenCalledWith(
        course.id,
      );

      expect(courseRepositoryMock.softDelete).toHaveBeenCalledWith(
        course.id,
        course.userId,
      );
    });

    it("administrator should be able to delete another user's course", async () => {
      const course = makeCourse({ userId: "2" });

      courseRepositoryMock.findById.mockResolvedValue(course);
      courseRepositoryMock.softDelete.mockResolvedValue(undefined);

      const softDeletedCourse = await service.softDelete(
        adminAuthUser,
        course.id,
      );

      expect(transactionMock.execute).toHaveBeenCalledTimes(1);

      expect(softDeletedCourse).toBe(undefined);

      expect(courseRepositoryMock.findById).toHaveBeenCalledTimes(1);
      expect(courseRepositoryMock.findById).toHaveBeenCalledWith(course.id);

      expect(moduleRepositoryMock.softDeleteByCourseId).toHaveBeenCalledTimes(1)
      expect(moduleRepositoryMock.softDeleteByCourseId).toHaveBeenCalledWith(course.id)

      expect(courseRepositoryMock.softDelete).toHaveBeenCalledTimes(1);
      expect(courseRepositoryMock.softDelete).toHaveBeenCalledWith(
        course.id,
        course.userId,
      );
    });

    it("should throw an authorization error because a regular user tried to delete another user's course", async () => {
      const course = makeCourse({ userId: "3" });

      courseRepositoryMock.findById.mockResolvedValue(course);

      const softDeletedCourse = service.softDelete(userAuthUser, course.id);

      await expect(softDeletedCourse).rejects.toThrow("Ação não autorizada");
      await expect(softDeletedCourse).rejects.toBeInstanceOf(
        AuthorizationError,
      );

      expect(transactionMock.execute).toHaveBeenCalledTimes(1);

      expect(courseRepositoryMock.findById).toHaveBeenCalledTimes(1);
      expect(courseRepositoryMock.findById).toHaveBeenCalledWith(course.id);


      expect(moduleRepositoryMock.softDeleteByCourseId).not.toHaveBeenCalled();

      expect(courseRepositoryMock.softDelete).not.toHaveBeenCalled();
    });

    it("should propagate a findById dependency error.", async () => {
      courseRepositoryMock.findById.mockRejectedValue(new Error());

      const softDeletedCourse = service.softDelete(userAuthUser, "1");

      await expect(softDeletedCourse).rejects.toBeInstanceOf(Error);

      expect(courseRepositoryMock.findById).toHaveBeenCalledTimes(1);
      expect(courseRepositoryMock.findById).toHaveBeenCalledWith("1");

      expect(moduleRepositoryMock.softDeleteByCourseId).not.toHaveBeenCalled();

      expect(courseRepositoryMock.softDelete).not.toHaveBeenCalled();
    });

    it("should propagatse a softDelete dependency error.", async () => {
      const course = makeCourse({ userId: "3" });

      courseRepositoryMock.findById.mockResolvedValue(course);
      courseRepositoryMock.softDelete.mockRejectedValue(new Error());

      const softDeletedCourse = service.softDelete(adminAuthUser, course.id);

      await expect(softDeletedCourse).rejects.toBeInstanceOf(Error);

      expect(courseRepositoryMock.findById).toHaveBeenCalledTimes(1);
      expect(courseRepositoryMock.findById).toHaveBeenCalledWith(course.id);

      expect(moduleRepositoryMock.softDeleteByCourseId).toHaveBeenCalledTimes(
        1,
      );
      expect(moduleRepositoryMock.softDeleteByCourseId).toHaveBeenCalledWith(
        course.id,
      );

      expect(courseRepositoryMock.softDelete).toHaveBeenCalledTimes(1);
      expect(courseRepositoryMock.softDelete).toHaveBeenCalledWith(
        course.id,
        course.userId,
      );
    });

    it("Nothing should be returned because the course no longer exists.", async () => {
      courseRepositoryMock.findById.mockResolvedValue(null);

      const softDeletedCourse = await service.softDelete(userAuthUser, "3");

      expect(softDeletedCourse).toBe(undefined);

      expect(transactionMock.execute).toHaveBeenCalledTimes(1);

      expect(courseRepositoryMock.findById).toHaveBeenCalledTimes(1);
      expect(courseRepositoryMock.findById).toHaveBeenCalledWith("3");

      expect(moduleRepositoryMock.softDeleteByCourseId).not.toHaveBeenCalled();

      expect(courseRepositoryMock.softDelete).not.toHaveBeenCalled();
    });
  });

  describe("create tests", () => {
    it("The regular user should be able to create a course for themselves specifying the userid", async () => {
      const course = makeCourse({ userId: userAuthUser.id });

      const createCourseData: CreateCourseDTO = {
        userId: userAuthUser.id,
        title: "TEST",
        description: "test",
      };

      courseRepositoryMock.create.mockResolvedValue(course);

      const createdCourse = await service.create(userAuthUser, {
        ...createCourseData,
        title: "test    ",
      });

      expect(createdCourse).toMatchObject(
        expect.objectContaining({
          id: expect.any(String),
          title: expect.any(String),
          description: expect.any(String),
          createdAt: expect.any(String),
          updatedAt: expect.any(String),
        }),
      );

      expect(createdCourse).not.toHaveProperty("deletedAt");
      expect(createdCourse).not.toHaveProperty("userid");

      expect(userRepositoryMock.findById).not.toHaveBeenCalled();

      expect(courseRepositoryMock.create).toHaveBeenCalledTimes(1);
      expect(courseRepositoryMock.create).toHaveBeenCalledWith(
        createCourseData,
      );

      expect(sanitizeMock.sanitizeName).toHaveBeenCalledTimes(1);
      expect(sanitizeMock.sanitizeName).toHaveBeenCalledWith("test    ");
    });

    it("The regular user should be able to create a course for themselves without specifying the userid", async () => {
      const course = makeCourse({ userId: userAuthUser.id });

      const createCourseData: CreateCourseDTO = {
        title: "TEST",
        description: "test",
      };

      courseRepositoryMock.create.mockResolvedValue(course);

      const createdCourse = await service.create(userAuthUser, {
        ...createCourseData,
        title: "test    ",
      });

      expect(createdCourse).toMatchObject(
        expect.objectContaining({
          id: expect.any(String),
          title: expect.any(String),
          description: expect.any(String),
          createdAt: expect.any(String),
          updatedAt: expect.any(String),
        }),
      );

      expect(createdCourse).not.toHaveProperty("deletedAt");
      expect(createdCourse).not.toHaveProperty("userid");

      expect(userRepositoryMock.findById).not.toHaveBeenCalled();

      expect(courseRepositoryMock.create).toHaveBeenCalledTimes(1);
      expect(courseRepositoryMock.create).toHaveBeenCalledWith({
        ...createCourseData,
        userId: userAuthUser.id,
      });

      expect(sanitizeMock.sanitizeName).toHaveBeenCalledTimes(1);
      expect(sanitizeMock.sanitizeName).toHaveBeenCalledWith("test    ");
    });

    it("admin user should successfully create a course for another user.", async () => {
      const course = makeCourse({ userId: adminAuthUser.id });

      const createCourseData: CreateCourseDTO = {
        userId: userAuthUser.id,
        title: "TEST",
        description: "test",
      };

      courseRepositoryMock.create.mockResolvedValue(course);
      userRepositoryMock.findById.mockResolvedValue(
        makeUser({ id: userAuthUser.id }),
      );

      const createdCourse = await service.create(adminAuthUser, {
        ...createCourseData,
        title: "test    ",
      });

      expect(createdCourse).toMatchObject(
        expect.objectContaining({
          id: expect.any(String),
          title: expect.any(String),
          description: expect.any(String),
          createdAt: expect.any(String),
          updatedAt: expect.any(String),
        }),
      );

      expect(createdCourse).not.toHaveProperty("deletedAt");
      expect(createdCourse).not.toHaveProperty("userid");

      expect(userRepositoryMock.findById).toHaveBeenCalledTimes(1);
      expect(userRepositoryMock.findById).toHaveBeenCalledWith(userAuthUser.id);

      expect(courseRepositoryMock.create).toHaveBeenCalledTimes(1);
      expect(courseRepositoryMock.create).toHaveBeenCalledWith({
        ...createCourseData,
        userId: userAuthUser.id,
      });

      expect(sanitizeMock.sanitizeName).toHaveBeenCalledTimes(1);
      expect(sanitizeMock.sanitizeName).toHaveBeenCalledWith("test    ");
    });

    it("The administrator user should be able to create a course for themselves without specifying the userid.", async () => {
      const course = makeCourse({ userId: adminAuthUser.id });

      const createCourseData: CreateCourseDTO = {
        title: "TEST",
        description: "test",
      };

      courseRepositoryMock.create.mockResolvedValue(course);

      const createdCourse = await service.create(adminAuthUser, {
        ...createCourseData,
        title: "test    ",
      });

      expect(createdCourse).toMatchObject(
        expect.objectContaining({
          id: expect.any(String),
          title: expect.any(String),
          description: expect.any(String),
          createdAt: expect.any(String),
          updatedAt: expect.any(String),
        }),
      );

      expect(createdCourse).not.toHaveProperty("deletedAt");
      expect(createdCourse).not.toHaveProperty("userid");

      expect(userRepositoryMock.findById).not.toHaveBeenCalled();

      expect(courseRepositoryMock.create).toHaveBeenCalledTimes(1);
      expect(courseRepositoryMock.create).toHaveBeenCalledWith({
        ...createCourseData,
        userId: adminAuthUser.id,
      });

      expect(sanitizeMock.sanitizeName).toHaveBeenCalledTimes(1);
      expect(sanitizeMock.sanitizeName).toHaveBeenCalledWith("test    ");
    });

    it("The administrator user should be able to create a course for themselves specifying the userid.", async () => {
      const course = makeCourse({ userId: adminAuthUser.id });

      const createCourseData: CreateCourseDTO = {
        userId: adminAuthUser.id,
        title: "TEST",
        description: "test",
      };

      courseRepositoryMock.create.mockResolvedValue(course);

      const createdCourse = await service.create(adminAuthUser, {
        ...createCourseData,
        title: "test    ",
      });

      expect(createdCourse).toMatchObject(
        expect.objectContaining({
          id: expect.any(String),
          title: expect.any(String),
          description: expect.any(String),
          createdAt: expect.any(String),
          updatedAt: expect.any(String),
        }),
      );

      expect(createdCourse).not.toHaveProperty("deletedAt");
      expect(createdCourse).not.toHaveProperty("userid");

      expect(userRepositoryMock.findById).not.toHaveBeenCalled();

      expect(courseRepositoryMock.create).toHaveBeenCalledTimes(1);
      expect(courseRepositoryMock.create).toHaveBeenCalledWith(
        createCourseData,
      );

      expect(sanitizeMock.sanitizeName).toHaveBeenCalledTimes(1);
      expect(sanitizeMock.sanitizeName).toHaveBeenCalledWith("test    ");
    });

    it("When a regular user tries to create a course for another user, an authorization error is triggered.", async () => {
      const createCourseData: CreateCourseDTO = {
        userId: "fake-id",
        title: "TEST",
        description: "test",
      };

      const createdCourse = service.create(userAuthUser, {
        ...createCourseData,
        title: "test   ",
      });

      await expect(createdCourse).rejects.toThrow("Ação não autorizada");
      await expect(createdCourse).rejects.toBeInstanceOf(AuthorizationError);

      expect(userRepositoryMock.findById).not.toHaveBeenCalled();

      expect(courseRepositoryMock.create).not.toHaveBeenCalled();
    });

    it("When the admin user tries to create a course for a user that does not exist, a notfounderror is thrown.", async () => {
      const createCourseData: CreateCourseDTO = {
        userId: "fake-id",
        title: "TEST",
        description: "test",
      };

      userRepositoryMock.findById.mockResolvedValue(null);

      const createdCourse = service.create(adminAuthUser, {
        ...createCourseData,
        title: "test   ",
      });
      await expect(createdCourse).rejects.toThrow("Usuário não encontrado");
      await expect(createdCourse).rejects.toBeInstanceOf(NotFoundError);

      expect(userRepositoryMock.findById).toHaveBeenCalledTimes(1);
      expect(userRepositoryMock.findById).toHaveBeenCalledWith(
        createCourseData.userId,
      );

      expect(courseRepositoryMock.create).not.toHaveBeenCalled();
    });

    it("should propagate findbyid dependency error.", async () => {
      const createCourseData: CreateCourseDTO = {
        userId: "fake-id",
        title: "TEST",
        description: "test",
      };

      userRepositoryMock.findById.mockRejectedValue(new Error());

      const createdCourse = service.create(adminAuthUser, {
        ...createCourseData,
        title: "test   ",
      });

      await expect(createdCourse).rejects.toBeInstanceOf(Error);

      expect(userRepositoryMock.findById).toHaveBeenCalledTimes(1);
      expect(userRepositoryMock.findById).toHaveBeenCalledWith(
        createCourseData.userId,
      );

      expect(courseRepositoryMock.create).not.toHaveBeenCalled();
    });

    it("should propagate create dependency error.", async () => {
      const createCourseData: CreateCourseDTO = {
        title: "TEST",
        description: "test",
      };

      courseRepositoryMock.create.mockRejectedValue(new Error());

      const createdCourse = service.create(userAuthUser, {
        ...createCourseData,
        title: "test    ",
      });

      await expect(createdCourse).rejects.toBeInstanceOf(Error);

      expect(userRepositoryMock.findById).not.toHaveBeenCalled();

      expect(courseRepositoryMock.create).toHaveBeenCalledTimes(1);
      expect(courseRepositoryMock.create).toHaveBeenCalledWith({
        ...createCourseData,
        userId: userAuthUser.id,
      });
      expect(sanitizeMock.sanitizeName).toHaveBeenCalledTimes(1);
      expect(sanitizeMock.sanitizeName).toHaveBeenCalledWith("test    ");
    });
  });

  describe("update tests", () => {
    const data: Partial<Omit<CreateCourseDTO, "userId">> = {
      title: "test updated  ",
    };

    it("The authenticated user should be able to successfully update a course for themselves.", async () => {
      const course = makeCourse({ userId: userAuthUser.id });

      courseRepositoryMock.findById.mockResolvedValue(course);
      courseRepositoryMock.update.mockResolvedValue({
        ...course,
        title: data.title!,
      });

      const updatedCourse = await service.update(userAuthUser, course.id, data);

      expect(updatedCourse).toMatchObject(
        expect.objectContaining({
          id: expect.any(String),
          title: expect.any(String),
          description: expect.any(String),
          createdAt: expect.any(String),
          updatedAt: expect.any(String),
        }),
      );

      expect(updatedCourse).not.toHaveProperty("userId");
      expect(updatedCourse).not.toHaveProperty("deletedAt");
      expect(courseRepositoryMock.findById).toHaveBeenCalledTimes(1);
      expect(courseRepositoryMock.findById).toHaveBeenCalledWith(course.id);

      expect(courseRepositoryMock.update).toHaveBeenCalledTimes(1);
      expect(courseRepositoryMock.update).toHaveBeenCalledWith(course.id, {
        title: "TEST UPDATED",
        description: course.description,
      });

      expect(sanitizeMock.sanitizeName).toHaveBeenCalledTimes(1);
      expect(sanitizeMock.sanitizeName).toHaveBeenCalledWith(data.title);
    });

    it("The admin user should be able to successfully update a course for another user.", async () => {
      const course = makeCourse({ userId: userAuthUser.id });

      courseRepositoryMock.findById.mockResolvedValue(course);
      courseRepositoryMock.update.mockResolvedValue({
        ...course,
        title: data.title!,
      });

      const updatedCourse = await service.update(
        adminAuthUser,
        course.id,
        data,
      );

      expect(updatedCourse).toMatchObject(
        expect.objectContaining({
          id: expect.any(String),
          title: expect.any(String),
          description: expect.any(String),
          createdAt: expect.any(String),
          updatedAt: expect.any(String),
        }),
      );

      expect(updatedCourse).not.toHaveProperty("userId");
      expect(updatedCourse).not.toHaveProperty("deletedAt");
      expect(courseRepositoryMock.findById).toHaveBeenCalledTimes(1);
      expect(courseRepositoryMock.findById).toHaveBeenCalledWith(course.id);

      expect(courseRepositoryMock.update).toHaveBeenCalledTimes(1);
      expect(courseRepositoryMock.update).toHaveBeenCalledWith(course.id, {
        title: "TEST UPDATED",
        description: course.description,
      });
      expect(sanitizeMock.sanitizeName).toHaveBeenCalledTimes(1);
      expect(sanitizeMock.sanitizeName).toHaveBeenCalledWith(data.title);
    });

    it("When a regular user attempts to update a course for another user, an authorization error is triggered.", async () => {
      const course = makeCourse({ userId: "FAKE-ID" });

      courseRepositoryMock.findById.mockResolvedValue(course);

      const updatedCourse = service.update(userAuthUser, course.id, data);

      await expect(updatedCourse).rejects.toThrow("Ação não autorizada");
      await expect(updatedCourse).rejects.toBeInstanceOf(AuthorizationError);

      expect(courseRepositoryMock.findById).toHaveBeenCalledTimes(1);
      expect(courseRepositoryMock.findById).toHaveBeenCalledWith(course.id);

      expect(courseRepositoryMock.update).not.toHaveBeenCalled();
      expect(sanitizeMock.sanitizeName).not.toHaveBeenCalled();
    });

    it("should throw a NotFoundError because there is no course with the given ID.", async () => {
      courseRepositoryMock.findById.mockResolvedValue(null);

      const updatedCourse = service.update(userAuthUser, "fake-id", data);

      await expect(updatedCourse).rejects.toThrow("Curso não encontrado");
      await expect(updatedCourse).rejects.toBeInstanceOf(NotFoundError);

      expect(courseRepositoryMock.findById).toHaveBeenCalledTimes(1);
      expect(courseRepositoryMock.findById).toHaveBeenCalledWith("fake-id");

      expect(courseRepositoryMock.update).not.toHaveBeenCalled();
      expect(sanitizeMock.sanitizeName).not.toHaveBeenCalled();
    });

    it("should propagate a findById dependence error", async () => {
      courseRepositoryMock.findById.mockRejectedValue(new Error());

      const updatedCourse = service.update(userAuthUser, "fake-id", data);

      await expect(updatedCourse).rejects.toBeInstanceOf(Error);

      expect(courseRepositoryMock.findById).toHaveBeenCalledTimes(1);
      expect(courseRepositoryMock.findById).toHaveBeenCalledWith("fake-id");

      expect(courseRepositoryMock.update).not.toHaveBeenCalled();
      expect(sanitizeMock.sanitizeName).not.toHaveBeenCalled();
    });

    it("should propagate a update dependence error", async () => {
      const course = makeCourse({ userId: userAuthUser.id });

      courseRepositoryMock.findById.mockResolvedValue(course);
      courseRepositoryMock.update.mockRejectedValue(new Error());

      const updatedCourse = service.update(userAuthUser, course.id, data);

      await expect(updatedCourse).rejects.toBeInstanceOf(Error);

      expect(courseRepositoryMock.findById).toHaveBeenCalledTimes(1);
      expect(courseRepositoryMock.findById).toHaveBeenCalledWith(course.id);

      expect(courseRepositoryMock.update).toHaveBeenCalledTimes(1);
      expect(courseRepositoryMock.update).toHaveBeenCalledWith(course.id, {
        title: "TEST UPDATED",
        description: course.description,
      });

      expect(sanitizeMock.sanitizeName).toHaveBeenCalledTimes(1);
      expect(sanitizeMock.sanitizeName).toHaveBeenCalledWith(data.title);
    });

    it("Tests behavior when updating description.", async () => {
      const data = {
        description: "Description Updated",
      };
      const course = makeCourse({ userId: userAuthUser.id });

      courseRepositoryMock.findById.mockResolvedValue(course);
      courseRepositoryMock.update.mockResolvedValue({
        ...course,
        description: data.description,
      });

      const updatedCourse = await service.update(userAuthUser, course.id, data);

      expect(updatedCourse).toMatchObject(
        expect.objectContaining({
          id: expect.any(String),
          title: expect.any(String),
          description: expect.any(String),
          createdAt: expect.any(String),
          updatedAt: expect.any(String),
        }),
      );

      expect(updatedCourse).not.toHaveProperty("userId");
      expect(updatedCourse).not.toHaveProperty("deletedAt");
      expect(courseRepositoryMock.findById).toHaveBeenCalledTimes(1);
      expect(courseRepositoryMock.findById).toHaveBeenCalledWith(course.id);

      expect(courseRepositoryMock.update).toHaveBeenCalledTimes(1);
      expect(courseRepositoryMock.update).toHaveBeenCalledWith(course.id, {
        title: course.title,
        description: data.description,
      });

      expect(sanitizeMock.sanitizeName).not.toHaveBeenCalled();
    });
  });
});
