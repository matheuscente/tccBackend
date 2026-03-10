import type { Session, User } from "@prisma/client";
import { prismaTests } from "../../../lib/prisma-tests";
import type { CreateSessionDTO } from "..//../sessions/DTOs/create-session.DTO";
import { SessionRepository } from "./session.repository";
import { UserRepository } from "../../users/repositories/user.repository";
import { makeSession } from "../../../tests/factories/make-session";
import { randomUUID } from "crypto";
describe("SessionRepository tests", () => {
  const repository = new SessionRepository(prismaTests);
  const userRepository = new UserRepository(prismaTests);

  let user: User, refreshToken: string, userId: string;


  beforeAll(async () => {
    await prismaTests.$connect();


  });

  afterAll(async () => {
    await prismaTests.$disconnect();
  });

  beforeEach(async () => {
    user = await userRepository.create({
      name: "test",
      username: `test-${crypto.randomUUID()}`,
      password: "test",
      birthDate: new Date("2000-01-01"),
    });
  })
  afterEach(async () => {
    await prismaTests.session.deleteMany();
    await prismaTests.user.deleteMany()
  });

  describe("create tests", () => {
    it("should create a session", async () => {
      const createdSession: CreateSessionDTO = makeSession({userId: user.id});

      const sessionReturns = await repository.create(createdSession);

      //integrity test
      expect(sessionReturns).not.toBeNull();

      //isValid test
      expect(sessionReturns?.isValid).toBe(true);

      //createdAt test
      expect(sessionReturns).toHaveProperty("createdAt");

      //createdAt test
      expect(sessionReturns?.createdAt).not.toBe(null);

      //refreshToken test
      expect(sessionReturns?.refreshToken).toEqual(createdSession.refreshToken);

      //expiresAt test
      expect(sessionReturns?.expiresAt).toEqual(createdSession.expiresAt);

      //userId test
      expect(sessionReturns?.userId).toEqual(createdSession.userId);

      //id test
      expect(sessionReturns?.id).toBeDefined();

      //updatedAt test
      expect(sessionReturns?.updatedAt).not.toBe(null);
      expect(sessionReturns?.updatedAt).toBeInstanceOf(Date);
    });
  });

  describe("findByUserId tests", () => {
    let session: Session;
    beforeEach(async () => {
      session = await repository.create(makeSession({userId: user.id}));
      refreshToken = session.refreshToken;
      userId = session.userId;
    });

    it("should find a session by userId", async () => {
      const sessionReturns: Session[] = await repository.findByUserId(userId);

      expect(sessionReturns).not.toBeNull();

      expect(sessionReturns.length).toBe(1);

      expect(sessionReturns[0]?.createdAt).toBeInstanceOf(Date);

      expect(sessionReturns[0]?.updatedAt).toBeInstanceOf(Date);

      expect(sessionReturns[0]).toMatchObject({
        id: session.id,
        refreshToken: session.refreshToken,
        userId: session.userId,
        isValid: true,
      });
    });

    it("It should return an empty array because there is no session with the userId provided in the database", async () => {
      const sessionReturns: Session[] = await repository.findByUserId("123");

      expect(sessionReturns.length).toBe(0);
    });
  });

  describe("findById tests", () => {
    let session: Session;

    beforeEach(async () => {
      session = await repository.create(makeSession({userId: user.id}));
      refreshToken = session.refreshToken;
      userId = session.userId;
    })

    it("should find a session by id", async () => {
      const sessionReturns = repository.findById(session.id);

      await expect(sessionReturns).resolves.not.toBeNull();

      await expect(sessionReturns).resolves.toMatchObject({
        id: session.id,
        refreshToken: session.refreshToken,
        userId: session.userId,
        isValid: true,
        createdAt: expect.any(Date),
        updatedAt: expect.any(Date),
      });
    });

    it("It should return an empty array because there is no session with the id provided in the database", async () => {
      const sessionReturns = await repository.findById("invalid id");

      expect(sessionReturns).toBe(null);
    });
  });

  describe("invalidate tests", () => {
    let session: Session;
    beforeEach(async () => {
      session = await repository.create(makeSession({userId: user.id}));
      refreshToken = session.refreshToken;
      userId = session.userId;
    });

    it("should invalidate a session", async () => {
      await repository.invalidate(session.id);

      const invalidSession = await repository.findById(session.id);

      expect(invalidSession?.isValid).toBe(false);
      expect(invalidSession?.updatedAt).not.toEqual(session.updatedAt);
    });
  });

  describe("update tests", () => {
    it("should update refreshToken and expiresAt", async () => {
      const session = await prismaTests.session.create({
        data: {
          userId: user.id,
          refreshToken: "old-hash",
          expiresAt: new Date("2030-01-01T00:00:00Z"),
          isValid: true,
        },
      });

      const newData = {
        refreshToken: "new-hash",
        expiresAt: new Date("2031-01-01T00:00:00Z"),
      };

      await repository.update(session.id, newData);

      const updated = await prismaTests.session.findUnique({
        where: { id: session.id },
      });

      expect(updated).not.toBeNull();
      expect(updated?.refreshToken).toBe("new-hash");
      expect(updated?.expiresAt.toISOString()).toBe("2031-01-01T00:00:00.000Z");
      expect(updated?.isValid).toBe(true);
    });

    it("should not create a new session", async () => {
      const session = await prismaTests.session.create({
        data: {
          userId: user.id,
          refreshToken: "old-hash",
          expiresAt: new Date("2030-01-01T00:00:00Z"),
          isValid: true,
        },
      });
      await repository.update(session.id, {
        refreshToken: "new-hash",
        expiresAt: new Date("2031-01-01T00:00:00Z"),
      });

      const sessions = await prismaTests.session.findMany();

      expect(sessions.length).toBe(1);
    });

    it("should throw if session does not exist", async () => {
      await expect(
        repository.update("invalid-id", {
          refreshToken: "hash",
          expiresAt: new Date(),
        }),
      ).rejects.toThrow();
    });
  });

   describe("invalidateAllByUserId tests", () => {
    let session: Session;
    beforeEach(async () => {
      session = await repository.create(makeSession({userId: user.id}));
      refreshToken = session.refreshToken;
      userId = session.userId;
    });

    it("should invalidate all sessions for a user.", async () => {
      await repository.create(makeSession({
        id: randomUUID(),
        userId: user.id,
        refreshToken: randomUUID()
      }))
      await repository.invalidateAllByUserId(user.id);

      const invalidSessions = await repository.findByUserId(user.id);

      expect(invalidSessions.length).toBe(2)
      expect(invalidSessions.every(item => item.isValid === false)).toBe(true)
    });
  });

  describe("findByIdWithUser tests", () => {
    let session: Session;

    it("should find a session by id", async () => {
      session = await repository.create(makeSession({userId: user.id}));
      refreshToken = session.refreshToken;
      userId = session.userId;

      const sessionReturns = await repository.findByIdWithUser(session.id);

      expect(sessionReturns).not.toBeNull();
      expect(sessionReturns).toMatchObject({
        id: session.id,
        refreshToken: session.refreshToken,
        userId: session.userId,
        isValid: true,
        createdAt: expect.any(Date),
        updatedAt: expect.any(Date),
        user: {
          id: expect.any(String),
          role: expect.any(String),
          deletedAt: null
        }
      });
    });

    it("It should return an empty array because there is no session with the id provided in the database", async () => {
      const sessionReturns = await repository.findById("invalid id");

      expect(sessionReturns).toBe(null);
    });
  });


});
