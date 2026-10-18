import { ForbiddenError } from "../errors/forbidden.error";
import { NotFoundError } from "../errors/not-found-error";
import { ValidationError } from "../errors/validation-error";
import type { ICourseRepository } from "../../modules/courses/interfaces/repositories/course-repository.interface";
import type { IModuleRepository } from "../../modules/modules/interfaces/repositories/module-repository.interface";
import type { IDisciplineRepository } from "../../modules/disciplines/interfaces/repositories/discipline-repository.interface";
import { makeCourse } from "../../tests/factories/make-course";
import { makeModule } from "../../tests/factories/make-module";
import { makeDiscipline } from "../../tests/factories/make-discipline";
import { ScopeService } from "./scope.service";

describe("ScopeService", () => {

  const courseRepositoryMock: jest.Mocked<ICourseRepository> = {
    create: jest.fn(),
    findById: jest.fn(),
    findOwnedById: jest.fn(),
    findAllByUserId: jest.fn(),
    update: jest.fn(),
    softDelete: jest.fn(),
    softDeleteAllByUserId: jest.fn(),
  };

  const moduleRepositoryMock: jest.Mocked<IModuleRepository> = {
    findById: jest.fn(),
    findAllByCourseId: jest.fn(),
    findAllByCourseIdWithOwner: jest.fn(),
    findByIdWithOwner: jest.fn(),
    findByIdWithCourse: jest.fn(),
    findAllByUserId: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    softDelete: jest.fn(),
    softDeleteAllByCourseIds: jest.fn(),
  };

  const disciplineRepositoryMock: jest.Mocked<IDisciplineRepository> = {
    findById: jest.fn(),
    findAllByModuleId: jest.fn(),
    findAllByModuleIdWithOwner: jest.fn(),
    findByIdWithOwner: jest.fn(),
    findAllByUserId: jest.fn(),
    findByIdWithCourse: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    softDelete: jest.fn(),
    softDeleteAllByModuleIds: jest.fn(),
  };

  const ownerId = "user-id";

  const service = new ScopeService(courseRepositoryMock, moduleRepositoryMock, disciplineRepositoryMock);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("normalize", () => {
    it("should return all fields as null when no scope is informed", () => {
      expect(service.normalize({})).toEqual({ courseId: null, moduleId: null, disciplineId: null });
    });

    it("should keep the informed scope and fill the others with null", () => {
      expect(service.normalize({ moduleId: "module-id" })).toEqual({ courseId: null, moduleId: "module-id", disciplineId: null });
    });

    it("should throw ValidationError when more than one scope is informed", () => {
      expect(() => service.normalize({ courseId: "course-id", disciplineId: "discipline-id" })).toThrow(ValidationError);
      expect(() => service.normalize({ courseId: "course-id", moduleId: "module-id" })).toThrow("Informe apenas um escopo: curso, módulo ou disciplina");
    });

    it("should throw ValidationError when scope is required and none is informed", () => {
      expect(() => service.normalize({}, true)).toThrow(ValidationError);
      expect(() => service.normalize({ courseId: null }, true)).toThrow("Informe um escopo: curso, módulo ou disciplina");
    });

    it("should accept exactly one scope when required", () => {
      expect(service.normalize({ disciplineId: "discipline-id" }, true)).toEqual({ courseId: null, moduleId: null, disciplineId: "discipline-id" });
    });
  });

  describe("resolveOwned", () => {
    it("should return null when no scope is informed", async () => {
      const result = await service.resolveOwned({}, ownerId);

      expect(result).toBeNull();
      expect(courseRepositoryMock.findById).not.toHaveBeenCalled();
      expect(moduleRepositoryMock.findByIdWithCourse).not.toHaveBeenCalled();
      expect(disciplineRepositoryMock.findByIdWithCourse).not.toHaveBeenCalled();
    });

    it("should propagate ValidationError when more than one scope is informed", async () => {
      await expect(service.resolveOwned({ courseId: "c", moduleId: "m" }, ownerId)).rejects.toThrow(ValidationError);
    });

    describe("course", () => {
      it("should resolve the course path", async () => {
        const course = makeCourse({ userId: ownerId });
        courseRepositoryMock.findById.mockResolvedValue(course);

        const result = await service.resolveOwned({ courseId: course.id }, ownerId);

        expect(courseRepositoryMock.findById).toHaveBeenCalledWith(course.id);
        expect(result).toEqual({ courseId: course.id, moduleId: null, disciplineId: null, ownerId });
      });

      it("should throw NotFoundError when course does not exist", async () => {
        courseRepositoryMock.findById.mockResolvedValue(null);

        const promise = service.resolveOwned({ courseId: "missing" }, ownerId);

        await expect(promise).rejects.toThrow(NotFoundError);
        await expect(service.resolveOwned({ courseId: "missing" }, ownerId)).rejects.toThrow("Curso não encontrado");
      });

      it("should throw ForbiddenError when course belongs to another user", async () => {
        courseRepositoryMock.findById.mockResolvedValue(makeCourse({ userId: "other-user" }));

        await expect(service.resolveOwned({ courseId: "course-id" }, ownerId)).rejects.toThrow(ForbiddenError);
      });
    });

    describe("module", () => {
      it("should resolve the module path", async () => {
        const module = { ...makeModule({ courseId: "course-id" }), course: { userId: ownerId } };
        moduleRepositoryMock.findByIdWithCourse.mockResolvedValue(module);

        const result = await service.resolveOwned({ moduleId: module.id }, ownerId);

        expect(moduleRepositoryMock.findByIdWithCourse).toHaveBeenCalledWith(module.id);
        expect(result).toEqual({ courseId: "course-id", moduleId: module.id, disciplineId: null, ownerId });
      });

      it("should throw NotFoundError when module does not exist", async () => {
        moduleRepositoryMock.findByIdWithCourse.mockResolvedValue(null);

        await expect(service.resolveOwned({ moduleId: "missing" }, ownerId)).rejects.toThrow("Módulo não encontrado");
      });

      it("should throw ForbiddenError when module belongs to another user", async () => {
        moduleRepositoryMock.findByIdWithCourse.mockResolvedValue({ ...makeModule(), course: { userId: "other-user" } });

        await expect(service.resolveOwned({ moduleId: "module-id" }, ownerId)).rejects.toThrow(ForbiddenError);
      });
    });

    describe("discipline", () => {
      it("should resolve the full discipline path", async () => {
        const module = makeModule({ courseId: "course-id" });
        const discipline = { ...makeDiscipline({ moduleId: module.id }), module: { course: { userId: ownerId } } };
        disciplineRepositoryMock.findByIdWithCourse.mockResolvedValue(discipline);
        moduleRepositoryMock.findById.mockResolvedValue(module);

        const result = await service.resolveOwned({ disciplineId: discipline.id }, ownerId);

        expect(disciplineRepositoryMock.findByIdWithCourse).toHaveBeenCalledWith(discipline.id);
        expect(moduleRepositoryMock.findById).toHaveBeenCalledWith(module.id);
        expect(result).toEqual({ courseId: "course-id", moduleId: module.id, disciplineId: discipline.id, ownerId });
      });

      it("should throw NotFoundError when discipline does not exist", async () => {
        disciplineRepositoryMock.findByIdWithCourse.mockResolvedValue(null);

        await expect(service.resolveOwned({ disciplineId: "missing" }, ownerId)).rejects.toThrow("Disciplina não encontrada");
        expect(moduleRepositoryMock.findById).not.toHaveBeenCalled();
      });

      it("should throw ForbiddenError when discipline belongs to another user", async () => {
        disciplineRepositoryMock.findByIdWithCourse.mockResolvedValue({ ...makeDiscipline(), module: { course: { userId: "other-user" } } });

        await expect(service.resolveOwned({ disciplineId: "discipline-id" }, ownerId)).rejects.toThrow(ForbiddenError);
        expect(moduleRepositoryMock.findById).not.toHaveBeenCalled();
      });

      it("should throw NotFoundError when parent module does not exist", async () => {
        disciplineRepositoryMock.findByIdWithCourse.mockResolvedValue({ ...makeDiscipline(), module: { course: { userId: ownerId } } });
        moduleRepositoryMock.findById.mockResolvedValue(null);

        await expect(service.resolveOwned({ disciplineId: "discipline-id" }, ownerId)).rejects.toThrow("Módulo não encontrado");
      });
    });
  });

  describe("isWithin", () => {
    const path = { courseId: "course-1", moduleId: "module-1", disciplineId: "discipline-1", ownerId };

    it("should return true when outer scope is general", () => {
      expect(service.isWithin(path, { courseId: null, moduleId: null, disciplineId: null })).toBe(true);
    });

    it("should compare by course", () => {
      expect(service.isWithin(path, { courseId: "course-1", moduleId: null, disciplineId: null })).toBe(true);
      expect(service.isWithin(path, { courseId: "course-2", moduleId: null, disciplineId: null })).toBe(false);
    });

    it("should compare by module", () => {
      expect(service.isWithin(path, { courseId: null, moduleId: "module-1", disciplineId: null })).toBe(true);
      expect(service.isWithin(path, { courseId: null, moduleId: "module-2", disciplineId: null })).toBe(false);
    });

    it("should compare by discipline", () => {
      expect(service.isWithin(path, { courseId: null, moduleId: null, disciplineId: "discipline-1" })).toBe(true);
      expect(service.isWithin(path, { courseId: null, moduleId: null, disciplineId: "discipline-2" })).toBe(false);
    });

    it("should not consider a course-level item as within a module scope", () => {
      const coursePath = { courseId: "course-1", moduleId: null, disciplineId: null, ownerId };

      expect(service.isWithin(coursePath, { courseId: null, moduleId: "module-1", disciplineId: null })).toBe(false);
    });
  });
});
