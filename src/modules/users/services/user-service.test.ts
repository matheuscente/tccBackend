import type { User } from "@prisma/client";
import type { IHashProvider } from "../../../shared/hash/interfaces/hash-provider.interface";
import type { IUserRepository } from "../interfaces/user-repository.interface";
import { UserService } from "./user.service";
import { ValidationError } from "../../../shared/errors/validation-error";
import { NotFoundError } from "../../../shared/errors/not-found-error";
import type { UpdateUserDTO } from "../DTOs/update-user.dto";
import type { Isanitize } from "../../../shared/sanitize/interfaces/sanitize.interface";
import { makeUser } from "../../../tests/factories/make-user"
import type { ISessionService } from "../../sessions/interfaces/services/session-service.interface";


describe("user service tests", () => {

  const sanitizeMock: jest.Mocked<Isanitize> = {
    sanitizeUsername: jest.fn(),
    sanitizeName: jest.fn(),
    removeAccents: jest.fn()
  }

  sanitizeMock.sanitizeName.mockImplementation( ((value) => value.toUpperCase().trim()))
  sanitizeMock.sanitizeUsername.mockImplementation( ((value) => value.toLowerCase().trim()))


  const repositoryMock: jest.Mocked<IUserRepository> = {
    create: jest.fn(),
    findById: jest.fn(),
    findByUsername: jest.fn(),
    update: jest.fn(),
    updatePassword: jest.fn(),
    softDelete: jest.fn(),
  };

  const hashMock: jest.Mocked<IHashProvider> = {
    hash: jest.fn(),
    compare: jest.fn(),
  };

  const sessionServiceMock: jest.Mocked<ISessionService> = {
    createSession: jest.fn(),
    refreshSession: jest.fn(),
    invalidateSession: jest.fn(),
    invalidateAllByUserId: jest.fn()
    
  }

  const service = new UserService(repositoryMock, hashMock, sanitizeMock, sessionServiceMock);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("create tests", () => {
    it("should create a user successfully", async () => {
      const mockUserReturn = makeUser();
      repositoryMock.findByUsername.mockResolvedValue(null);
      hashMock.hash.mockResolvedValue("hashed password");

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
      expect(hashMock.hash).toHaveBeenCalledWith("123");
      expect(repositoryMock.create).toHaveBeenCalledWith({
        name: "TEST",
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

      expect(hashMock.hash).not.toHaveBeenCalled();
      await expect(user).rejects.toBeInstanceOf(ValidationError);
      await expect(user).rejects.toThrow("Insira outro nome de usuário");
      expect(repositoryMock.create).not.toHaveBeenCalled();
    });

    it("should return an error because the birthdate is invaid", async () => {
      repositoryMock.findByUsername.mockResolvedValue(null);
      hashMock.hash.mockResolvedValue("hashed password");

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
      hashMock.hash.mockResolvedValue("hashed password");

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

    describe("findWithPassword tests", () => {
    it("should find a user sucessfully", async () => {
      const user = makeUser();
      repositoryMock.findByUsername.mockResolvedValue(user);

      const userTest = await service.findWithPassword(user.id);

      expect(userTest).not.toBeNull();
      expect(userTest).not.toHaveProperty("deletedAt");
      expect(userTest).not.toHaveProperty("createdAt");
      expect(userTest).not.toHaveProperty("updatedAt");
      expect(userTest).not.toHaveProperty("birthDate");
      expect(userTest).not.toHaveProperty("name");
      expect(userTest).not.toHaveProperty("role");
      expect(repositoryMock.findByUsername).toHaveBeenCalledWith(user.id);
      expect(repositoryMock.findByUsername).toHaveBeenCalledTimes(1);
      expect(userTest).toMatchObject({
        id: user.id,
        username: user.username,
        password: user.password
      });
    });

    it("should return null because it cannot find a user with the given ID", async () => {
      repositoryMock.findByUsername.mockResolvedValue(null);

      const userTest = await service.findWithPassword("test");

      expect(userTest).toBeNull();
      expect(repositoryMock.findByUsername).toHaveBeenCalledWith("test");
      expect(repositoryMock.findByUsername).toHaveBeenCalledTimes(1);
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
      sessionServiceMock.invalidateAllByUserId.mockResolvedValue(undefined)

      await service.softDelete(user.id)

      expect(repositoryMock.softDelete).toHaveBeenCalledWith(user.id)
      expect(repositoryMock.softDelete).toHaveBeenCalledTimes(1)
      expect(sessionServiceMock.invalidateAllByUserId).toHaveBeenCalledTimes(1)
      expect(sessionServiceMock.invalidateAllByUserId).toHaveBeenCalledWith(user.id)
    })

    it('It should throw an error because there is no user with the given ID', async () => {
      const user = makeUser()
      repositoryMock.findById.mockResolvedValue(null)

      const userTest = service.softDelete(user.id)

      await expect(userTest).rejects.toBeInstanceOf(NotFoundError)
      await expect(userTest).rejects.toThrow("usuario não encontrado")
      expect(repositoryMock.softDelete).not.toHaveBeenCalled()
      expect(sessionServiceMock.invalidateAllByUserId).not.toHaveBeenCalled()
    })


  })

  describe("updatePassword tests", () => {

    it('should update a password sucessfully', async () => {
      const user = makeUser({ password: 'hashed-old-password' })
      repositoryMock.findById.mockResolvedValue(user)
      hashMock.hash.mockResolvedValue('hashed-new-password')
      hashMock.compare.mockResolvedValue(true)

      await service.updatePassword(user.id, 'old password', 'new password')

      expect(hashMock.compare).toHaveBeenCalledWith('old password', user.password)
      expect(hashMock.hash).toHaveBeenCalledTimes(1)
      expect(hashMock.hash).toHaveBeenCalledWith('new password')
      expect(repositoryMock.updatePassword).toHaveBeenCalledTimes(1)
      expect(repositoryMock.updatePassword).toHaveBeenCalledWith(user.id, 'hashed-new-password')
      expect(repositoryMock.updatePassword).toHaveBeenCalledTimes(1)

    })

    it('should throw an error because the entered password does not match the hashed password', async () => {
      const user = makeUser({ password: 'hashed-old-password' })
      repositoryMock.findById.mockResolvedValue(user)
      hashMock.compare.mockResolvedValue(false)

      const test = service.updatePassword(user.id, 'old password', 'new password')

      await expect(test).rejects.toBeInstanceOf(ValidationError)
      await expect(test).rejects.toThrow("senha inválida!")
      expect(hashMock.compare).toHaveBeenCalledWith('old password', user.password)
      expect(hashMock.hash).not.toHaveBeenCalled()
      expect(repositoryMock.updatePassword).not.toHaveBeenCalled()
    })

    it('should throw an error because there is no user with the given ID.', async () => {
      const user = makeUser({ password: 'hashed-old-password' })
      repositoryMock.findById.mockResolvedValue(null)

      const test = service.updatePassword(user.id, 'old password', 'new password')

      await expect(test).rejects.toBeInstanceOf(NotFoundError)
      await expect(test).rejects.toThrow('usuário não encontrado')
      expect(hashMock.hash).not.toHaveBeenCalled()
      expect(hashMock.compare).not.toHaveBeenCalled()
      expect(repositoryMock.updatePassword).not.toHaveBeenCalled()
    })

  })

  describe("update test", () => {
    it("should update a user sucessfully", async () => {
      const user = makeUser()
      repositoryMock.update.mockResolvedValue(user)
      repositoryMock.findById.mockResolvedValue(user)
      repositoryMock.findByUsername.mockResolvedValue(null)

      const test = await service.update('1', { name: 'name updated' })

      const dataUpdate: UpdateUserDTO = {
        name: 'name updated',
        username: user.username,
        birthDate: user.birthDate
      }

      expect(repositoryMock.findById).toHaveBeenCalledTimes(1)
      expect(repositoryMock.findById).toHaveBeenCalledWith('1')
      expect(repositoryMock.findByUsername).not.toHaveBeenCalled()
      expect(repositoryMock.update).toHaveBeenCalledTimes(1)
      expect(repositoryMock.update).toHaveBeenCalledWith('1', {...dataUpdate, name: "NAME UPDATED"})
      expect(test).toHaveProperty('role')
      expect(test).not.toHaveProperty('password')
      expect(test).not.toHaveProperty('deletedAt')


      expect(test).toMatchObject({
        id: expect.any(String),
        birthDate: expect.any(Date),
        name: expect.any(String),
        username: expect.any(String),
        updatedAt: expect.any(Date),
        createdAt: expect.any(Date)
      })
    })

    it("should throw error when username is already taken", async () => {
      const user = makeUser({ username: "duplicate" })
      repositoryMock.findById.mockResolvedValue(user);
      repositoryMock.findByUsername.mockResolvedValue(user);

      const promise = service.update('1', { username: "duplicate" });

      await expect(promise).rejects.toBeInstanceOf(ValidationError)
      await expect(promise).rejects.toThrow("Insira outro nome de usuário");
      expect(repositoryMock.findById).toHaveBeenCalledTimes(1)
      expect(repositoryMock.findById).toHaveBeenCalledWith('1')
      expect(repositoryMock.findByUsername).toHaveBeenCalledTimes(1)
      expect(repositoryMock.findByUsername).toHaveBeenCalledWith('duplicate')
      expect(repositoryMock.update).not.toHaveBeenCalled()

    });

    it("should throw an error when the user does not exist", async () => {
      repositoryMock.findById.mockResolvedValue(null);

      const promise = service.update('1', { username: "test" });

      await expect(promise).rejects.toBeInstanceOf(NotFoundError)
      await expect(promise).rejects.toThrow("Usuário não encontrado");
      expect(repositoryMock.findById).toHaveBeenCalledTimes(1)
      expect(repositoryMock.findById).toHaveBeenCalledWith('1')
      expect(repositoryMock.findByUsername).not.toHaveBeenCalled()
      expect(repositoryMock.update).not.toHaveBeenCalled()
    });

    it("should return an error because the birthdate is invaid", async () => {
      const user = makeUser()
      repositoryMock.findById.mockResolvedValue(user);

      const result = service.update('1', {
        birthDate: "31/02/2000",
      });

      expect(repositoryMock.update).not.toHaveBeenCalled();
      expect(repositoryMock.findByUsername).not.toHaveBeenCalled();
      await expect(result).rejects.toThrow("Data inválida!");
      await expect(result).rejects.toBeInstanceOf(ValidationError);
    });

    it("should return an error because the birthdate is later than the current date", async () => {
      const user = makeUser()
      repositoryMock.findById.mockResolvedValue(user);

      const year = new Date().getFullYear() + 1;

      const result = service.update('id', {
        birthDate: `01/01/${year}`
      });

      expect(repositoryMock.update).not.toHaveBeenCalled();
      expect(repositoryMock.findByUsername).not.toHaveBeenCalled();
      await expect(result).rejects.toThrow(
        "Data de nascimento maior que a data atual",
      );
      await expect(result).rejects.toBeInstanceOf(ValidationError);
    });

    it("should update a birthDate sucessfully", async () => {
      const user = makeUser()
      repositoryMock.update.mockResolvedValue(user)
      repositoryMock.findById.mockResolvedValue(user)
      repositoryMock.findByUsername.mockResolvedValue(null)

      const test = await service.update('1', { birthDate: '31/10/2001' })

      const birthDate = new Date(Date.UTC(2001, 9, 31, 0, 0, 0))

      const dataUpdate: UpdateUserDTO = {
        name: user.name,
        username: user.username,
        birthDate: birthDate
      }

      expect(repositoryMock.findById).toHaveBeenCalledTimes(1)
      expect(repositoryMock.findById).toHaveBeenCalledWith('1')
      expect(repositoryMock.findByUsername).not.toHaveBeenCalled()
      expect(repositoryMock.update).toHaveBeenCalledTimes(1)
      expect(repositoryMock.update).toHaveBeenCalledWith('1', dataUpdate)
      expect(test).toHaveProperty('role')
      expect(test).not.toHaveProperty('password')
      expect(test).not.toHaveProperty('deletedAt')


      expect(test).toMatchObject({
        id: expect.any(String),
        birthDate: expect.any(Date),
        name: expect.any(String),
        username: expect.any(String),
        updatedAt: expect.any(Date),
        createdAt: expect.any(Date)
      })
    })

  })
})
