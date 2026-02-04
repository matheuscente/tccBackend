import type { User } from "@prisma/client";
import type { IHashUtils } from "../../hash/interfaces/hash-utils.interface";
import type { IUserRepository } from "../interfaces/user-repository.interface";
import { UserService } from "./user.service";
import { ValidationError } from "../../../shared/errors/validation-error";
import { NotFoundError } from "../../../shared/errors/not-found-error";

describe("user service tests", () => {
  const makeUser = (overrides?: Partial<User>): User => ({
    id: "1",
    name: "Test",
    username: "test",
    role: "USER",
    birthDate: new Date("2000-01-01"),
    createdAt: new Date(),
    updatedAt: new Date(),
    password: "hashed password",
    deletedAt: null,
    ...overrides,
  });

  const repositoryMock: jest.Mocked<IUserRepository> = {
    create: jest.fn(),
    findById: jest.fn(),
    findByUsername: jest.fn(),
    update: jest.fn(),
    updatePassword: jest.fn(),
    softDelete: jest.fn(),
  };

  const hashMock: jest.Mocked<IHashUtils> = {
    hashPassword: jest.fn(),
    comparePassword: jest.fn(),
  };

  const service = new UserService(repositoryMock, hashMock);

  beforeEach(() => {
    jest.clearAllMocks();
  });


  describe("create tests", () => {

    it("should create a user successfully", async () => {
      const mockUserReturn = makeUser();
      repositoryMock.findByUsername.mockResolvedValue(null);
      hashMock.hashPassword.mockResolvedValue("hashed password");

      repositoryMock.create.mockResolvedValue(mockUserReturn);

      const result = await service.create({
        name: "Test",
        username: "test",
        password: "123",
        birthDate: "01/01/2000",
      });

      expect(result).not.toHaveProperty("password");
      expect(result).not.toHaveProperty("deletedAt");
      expect(result).toHaveProperty("id");
      expect(result).toHaveProperty("name");
      expect(result).toHaveProperty("username");
      expect(result).toHaveProperty("role");
      expect(result).toHaveProperty("birthDate");
      expect(result).toHaveProperty("createdAt");
      expect(result).toHaveProperty("updatedAt");
      expect(hashMock.hashPassword).toHaveBeenCalledWith("123");
      expect(repositoryMock.create).toHaveBeenCalledWith({
        name: "Test",
        username: "test",
        password: "hashed password",
        birthDate: new Date(Date.UTC(2000, 0, 1)),
      });
    });

    it("should return an error because the username already exists", async () => {
      repositoryMock.findByUsername.mockResolvedValue(makeUser());

      const user = service.create({
        name: "test",
        username: "test",
        password: "test",
        birthDate: "11/11/2000",
      });

      expect(hashMock.hashPassword).not.toHaveBeenCalled();
      await expect(user).rejects.toBeInstanceOf(ValidationError);
      await expect(user).rejects.toThrow("Insira outro nome de usuário");
      expect(repositoryMock.create).not.toHaveBeenCalled();
    });

    it("should return an error because the birthdate is invaid", async () => {
      repositoryMock.findByUsername.mockResolvedValue(null);
      hashMock.hashPassword.mockResolvedValue("hashed password");

      const result = service.create({
        name: "Test",
        username: "test",
        password: "123",
        birthDate: "31/02/2000",
      });

      expect(repositoryMock.create).not.toHaveBeenCalled();
      await expect(result).rejects.toThrow("Data inválida!");
      await expect(result).rejects.toBeInstanceOf(ValidationError);
    });

    it("should return an error because the birthdate is later than the current date", async () => {
      repositoryMock.findByUsername.mockResolvedValue(null);
      hashMock.hashPassword.mockResolvedValue("hashed password");

      const year = new Date().getFullYear() + 1;

      const result = service.create({
        name: "Test",
        username: "test",
        password: "123",
        birthDate: `01/01/${year}`,
      });

      expect(repositoryMock.create).not.toHaveBeenCalled();
      await expect(result).rejects.toThrow(
        "Data de nascimento maior que a data atual",
      );
      await expect(result).rejects.toBeInstanceOf(ValidationError);
    });
  });

  describe("findById tests", () => {

    it("should find a user sucessfully", async () => {
      const user = makeUser();
      repositoryMock.findById.mockResolvedValue(user);

      const userTest = await service.findById(user.id);

      expect(userTest).not.toBeNull();
      expect(userTest).not.toHaveProperty("password");
      expect(userTest).not.toHaveProperty("deletedAt");
      expect(userTest).toHaveProperty("createdAt");
      expect(userTest).toHaveProperty("updatedAt");
      expect(repositoryMock.findById).toHaveBeenCalledWith(user.id);
      expect(repositoryMock.findById).toHaveBeenCalledTimes(1);
      expect(userTest).toMatchObject({
        id: user.id,
        name: user.name,
        username: user.username,
        role: user.role,
        birthDate: user.birthDate,
      });
    });

    it("should return null because it cannot find a user with the given ID", async () => {
      repositoryMock.findById.mockResolvedValue(null);

      const userTest = await service.findById("123");

      expect(userTest).toBeNull();
      expect(repositoryMock.findById).toHaveBeenCalledWith("123");
      expect(repositoryMock.findById).toHaveBeenCalledTimes(1);
    });
  });

  describe("findByUsername tests", () => {

    it("should find a user sucessfully", async () => {
      const user = makeUser();
      repositoryMock.findByUsername.mockResolvedValue(user);

      const userTest = await service.findByUsername(user.username);

      expect(repositoryMock.findByUsername).toHaveBeenCalledTimes(1);
      expect(repositoryMock.findByUsername).toHaveBeenCalledWith(user.username);

      expect(userTest).toEqual(
        expect.objectContaining({
          id: expect.any(String),
          name: expect.any(String),
          username: expect.any(String),
          role: expect.any(String),
          birthDate: expect.any(Date),
          createdAt: expect.any(Date),
          updatedAt: expect.any(Date),
        }),
      );
    });

    it("should return null because it cannot find a user with the given username", async () => {
      repositoryMock.findByUsername.mockResolvedValue(null);

      const userTest = await service.findByUsername("username");

      expect(repositoryMock.findByUsername).toHaveBeenCalledTimes(1);
      expect(repositoryMock.findByUsername).toHaveBeenCalledWith("username");
      expect(userTest).toBeNull();
    });
  });

  describe("softDelete tests", () => {

    it('should delete a user sucessfully', async () => {
      const user = makeUser()
      repositoryMock.findById.mockResolvedValue(user)

      await service.softDelete(user.id)

      expect(repositoryMock.softDelete).toHaveBeenCalledWith(user.id)
      expect(repositoryMock.softDelete).toHaveBeenCalledTimes(1)


    })

    it('It should throw an error because there is no user with the given ID', async () => {
      const user = makeUser()
      repositoryMock.findById.mockResolvedValue(null)

      const userTest = service.softDelete(user.id)

      expect(repositoryMock.softDelete).not.toHaveBeenCalled()
      await expect(userTest).rejects.toBeInstanceOf(NotFoundError)
      await expect(userTest).rejects.toThrow("usuario não encontrado")

    })


  })

    describe("updatePassword tests", () => {

    it('should update a password sucessfully', async () => {
      const user = makeUser({password: 'hashed-old-password'})
      repositoryMock.findById.mockResolvedValue(user)
      hashMock.comparePassword.mockResolvedValue(true)

      await service.updatePassword(user.id, 'old password', 'new password')

      expect(repositoryMock.updatePassword).toHaveBeenCalledWith(user.id, 'old password', 'new password')
      expect(repositoryMock.updatePassword).toHaveBeenCalledTimes(1)
      expect(hashMock.comparePassword)


    })



  })
});
