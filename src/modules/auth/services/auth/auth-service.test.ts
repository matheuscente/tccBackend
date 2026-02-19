import type { IDateConvert } from "../../../../shared/convert/interfaces/date-convert.interface"
import type { IHashProvider } from "../../../../shared/hash/interfaces/hash-provider.interface"
import type { ISessionService } from "../../../sessions/interfaces/services/session-service.interface"
import type { IUserService } from "../../../users/interfaces/user-service.interface"
import type { IAccessTokenService } from "../../interfaces/access-token/access-token-service.interface"
import { makeUser } from "../../../../tests/factories/make-user"
import { makeSession } from "../../../../tests/factories/make-session"
import { AuthService } from "./auth.service"
import { ValidationError } from "../../../../shared/errors/validation-error"
import { NotFoundError } from "../../../../shared/errors/not-found-error"


describe(("authService teste"), ()=> {

  const userServiceMock: jest.Mocked<IUserService> = {
    create: jest.fn(),
    findById: jest.fn(),
    findByUsername: jest.fn(),
    findWithPassword: jest.fn(),
    update: jest.fn(),
    updatePassword: jest.fn(),
    softDelete: jest.fn(),
  }

  const sessionerviceMock: jest.Mocked<ISessionService> = {
    createSession: jest.fn(),
    refreshSession: jest.fn(),
    invalidateSession: jest.fn()
  }

    const hashMock: jest.Mocked<IHashProvider> = {
    hash: jest.fn(),
    compare: jest.fn(),
  }
    const dateConvertMock: jest.Mocked<IDateConvert> = {
        secondsToDate: jest.fn(),
        dateToSeconds: jest.fn(),
  }

    const accessTokenMock: jest.Mocked<IAccessTokenService> = {
    generateAccessToken: jest.fn(),
    extractPayload: jest.fn()
  }

  const service = new AuthService(userServiceMock, sessionerviceMock, hashMock, dateConvertMock, accessTokenMock)

    beforeEach(() => {
        jest.resetAllMocks();
        jest.clearAllMocks();
    });

    describe("login tests", () => {
      const user = makeUser(),
                session = makeSession({userId: user.id})

        it("should login successfully", async () => {

          hashMock.compare.mockResolvedValue(true)
          userServiceMock.findWithPassword.mockResolvedValue(user)
          sessionerviceMock.createSession.mockResolvedValue(session)
          dateConvertMock.dateToSeconds.mockReturnValue(20000)
          accessTokenMock.generateAccessToken.mockReturnValue("accessToken")

          const login = await service.login({
            username: "test",
            password: "test"
          })

          expect(userServiceMock.findWithPassword).toHaveBeenCalledTimes(1)
          expect(userServiceMock.findWithPassword).toHaveBeenCalledWith("test")

          expect(hashMock.compare).toHaveBeenCalledTimes(1)
          expect(hashMock.compare).toHaveBeenCalledWith("test", user.password)

          expect(sessionerviceMock.createSession).toHaveBeenCalledTimes(1)
          expect(sessionerviceMock.createSession).toHaveBeenCalledWith(user.id)

          expect(dateConvertMock.dateToSeconds).toHaveBeenCalledTimes(1)

          expect(accessTokenMock.generateAccessToken).toHaveBeenCalledTimes(1)
          expect(accessTokenMock.generateAccessToken).toHaveBeenCalledWith({sub: user.id, sessionId: session.id})

          expect(login).toEqual(expect.objectContaining({
            accessToken: expect.any(String),
            refreshToken: {
              token: expect.any(String),
              expiresAt: expect.any(Number)
            }
          }))
          

        })

        it("should throw an access token dependency error.", async () => {

          hashMock.compare.mockResolvedValue(true)
          userServiceMock.findWithPassword.mockResolvedValue(user)
          sessionerviceMock.createSession.mockResolvedValue(session)
          dateConvertMock.dateToSeconds.mockReturnValue(20000)
          accessTokenMock.generateAccessToken.mockImplementation(() => {
            throw new Error("access token error")
          })

          const login = service.login({
            username: "test",
            password: "test"
          })

          await expect(login).rejects.toThrow("access token error") 

          expect(userServiceMock.findWithPassword).toHaveBeenCalledTimes(1)
          expect(userServiceMock.findWithPassword).toHaveBeenCalledWith("test")

          expect(hashMock.compare).toHaveBeenCalledTimes(1)
          expect(hashMock.compare).toHaveBeenCalledWith("test", user.password)

          expect(sessionerviceMock.createSession).toHaveBeenCalledTimes(1)
          expect(sessionerviceMock.createSession).toHaveBeenCalledWith(user.id)

          expect(dateConvertMock.dateToSeconds).toHaveBeenCalledTimes(1)

          expect(accessTokenMock.generateAccessToken).toHaveBeenCalledTimes(1)
          expect(accessTokenMock.generateAccessToken).toHaveBeenCalledWith({sub: user.id, sessionId: session.id})
        })

        it("should throw an date convert dependency error.", async () => {

          hashMock.compare.mockResolvedValue(true)
          userServiceMock.findWithPassword.mockResolvedValue(user)
          sessionerviceMock.createSession.mockResolvedValue(session)
          dateConvertMock.dateToSeconds.mockImplementation(() => {
            throw new Error("date convert error")
          })

          const login = service.login({
            username: "test",
            password: "test"
          })

          await expect(login).rejects.toThrow("date convert error") 

          expect(userServiceMock.findWithPassword).toHaveBeenCalledTimes(1)
          expect(userServiceMock.findWithPassword).toHaveBeenCalledWith("test")

          expect(hashMock.compare).toHaveBeenCalledTimes(1)
          expect(hashMock.compare).toHaveBeenCalledWith("test", user.password)

          expect(sessionerviceMock.createSession).toHaveBeenCalledTimes(1)
          expect(sessionerviceMock.createSession).toHaveBeenCalledWith(user.id)

          expect(dateConvertMock.dateToSeconds).toHaveBeenCalledTimes(1)

          expect(accessTokenMock.generateAccessToken).not.toHaveBeenCalled()
        })

        it("should throw an createSession dependency error.", async () => {

          hashMock.compare.mockResolvedValue(true)
          userServiceMock.findWithPassword.mockResolvedValue(user)
          sessionerviceMock.createSession.mockRejectedValue( new Error("createSession error"))

          const login = service.login({
            username: "test",
            password: "test"
          })

          await expect(login).rejects.toThrow("createSession error") 

          expect(userServiceMock.findWithPassword).toHaveBeenCalledTimes(1)
          expect(userServiceMock.findWithPassword).toHaveBeenCalledWith("test")

          expect(hashMock.compare).toHaveBeenCalledTimes(1)
          expect(hashMock.compare).toHaveBeenCalledWith("test", user.password)

          expect(sessionerviceMock.createSession).toHaveBeenCalledTimes(1)
          expect(sessionerviceMock.createSession).toHaveBeenCalledWith(user.id)

          expect(dateConvertMock.dateToSeconds).not.toHaveBeenCalled()

          expect(accessTokenMock.generateAccessToken).not.toHaveBeenCalled()
        })

        it("should throw an error for password invalid.", async () => {

          hashMock.compare.mockResolvedValue(false)
          userServiceMock.findWithPassword.mockResolvedValue(user)

          const login = service.login({
            username: "test",
            password: "test"
          })

          await expect(login).rejects.toThrow("usuário ou senha inválidos") 
          await expect(login).rejects.toBeInstanceOf(ValidationError)

          expect(userServiceMock.findWithPassword).toHaveBeenCalledTimes(1)
          expect(userServiceMock.findWithPassword).toHaveBeenCalledWith("test")

          expect(hashMock.compare).toHaveBeenCalledTimes(1)
          expect(hashMock.compare).toHaveBeenCalledWith("test", user.password)

          expect(sessionerviceMock.createSession).not.toHaveBeenCalled()

          expect(dateConvertMock.dateToSeconds).not.toHaveBeenCalled()

          expect(accessTokenMock.generateAccessToken).not.toHaveBeenCalled()
        })

        it("should throw an error for username invalid.", async () => {

          userServiceMock.findWithPassword.mockResolvedValue(null)

          const login = service.login({
            username: "test",
            password: "test"
          })

          await expect(login).rejects.toThrow("usuário ou senha inválidos")
          
          await expect(login).rejects.toBeInstanceOf(ValidationError)

          expect(userServiceMock.findWithPassword).toHaveBeenCalledTimes(1)
          expect(userServiceMock.findWithPassword).toHaveBeenCalledWith("test")

          expect(hashMock.compare).not.toHaveBeenCalled()

          expect(sessionerviceMock.createSession).not.toHaveBeenCalled()

          expect(dateConvertMock.dateToSeconds).not.toHaveBeenCalled()

          expect(accessTokenMock.generateAccessToken).not.toHaveBeenCalled()
        })
    })

    describe("logout tests", () => {
      it("should make logout successfully", async () => {
        accessTokenMock.extractPayload.mockReturnValue({
          iat: 10000,
          exp: 10000,
          sub: "sub-test",
          sessionId: "sessionId-test"
        })

        sessionerviceMock.invalidateSession.mockResolvedValue(undefined)

        expect(await service.logout("test")).toBe(undefined)

        expect(accessTokenMock.extractPayload).toHaveBeenCalledTimes(1)
        expect(accessTokenMock.extractPayload).toHaveBeenCalledWith("test")

        expect(sessionerviceMock.invalidateSession).toHaveBeenCalledTimes(1)
        expect(sessionerviceMock.invalidateSession).toHaveBeenCalledWith("sessionId-test")


      })

      it("should throw an invalid access token error", async () => {
        accessTokenMock.extractPayload.mockImplementation(() => {
          throw new Error()
        })

        const logout = service.logout("test")

        await expect(logout).rejects.toThrow()

        expect(accessTokenMock.extractPayload).toHaveBeenCalledTimes(1)
        expect(accessTokenMock.extractPayload).toHaveBeenCalledWith("test")

        expect(sessionerviceMock.invalidateSession).not.toHaveBeenCalled()

      })

      it("should throw an session invalid error", async () => {
        accessTokenMock.extractPayload.mockReturnValue({
          iat: 10000,
          exp: 10000,
          sub: "sub-test",
          sessionId: "sessionId-test"
        })

        sessionerviceMock.invalidateSession.mockRejectedValue(new NotFoundError("sessão não encontrada"))

        const logout = service.logout("test")

        await expect(logout).rejects.toThrow("sessão inválida")
        await expect(logout).rejects.toBeInstanceOf(ValidationError)

        expect(accessTokenMock.extractPayload).toHaveBeenCalledTimes(1)
        expect(accessTokenMock.extractPayload).toHaveBeenCalledWith("test")

        expect(sessionerviceMock.invalidateSession).toHaveBeenCalledTimes(1)
        expect(sessionerviceMock.invalidateSession).toHaveBeenCalledWith("sessionId-test")


      })

      it("should throw an sessionInvalid internal error", async () => {
        accessTokenMock.extractPayload.mockReturnValue({
          iat: 10000,
          exp: 10000,
          sub: "sub-test",
          sessionId: "sessionId-test"
        })

        sessionerviceMock.invalidateSession.mockRejectedValue(new Error("invalidateSession error"))

        const logout = service.logout("test")

        await expect(logout).rejects.toThrow("invalidateSession error")

        expect(accessTokenMock.extractPayload).toHaveBeenCalledTimes(1)
        expect(accessTokenMock.extractPayload).toHaveBeenCalledWith("test")

        expect(sessionerviceMock.invalidateSession).toHaveBeenCalledTimes(1)
        expect(sessionerviceMock.invalidateSession).toHaveBeenCalledWith("sessionId-test")


      })


    })

    describe("refreshSession tests", () => {
      it("should update a session successfully", async () => {
        const refreshToken = "test-refresToken"
        const fakeAccessToken = "fake-accessToken"
        const fakeExpiresAt = 10000

        const session = makeSession({
          refreshToken
        })

        sessionerviceMock.refreshSession.mockResolvedValue(session)
        dateConvertMock.dateToSeconds.mockReturnValue(fakeExpiresAt)
        accessTokenMock.generateAccessToken.mockReturnValue(fakeAccessToken)

        const updatedSession = await service.refreshSession("old-refresh-token")

        expect(updatedSession).toEqual(
          {
            accessToken: fakeAccessToken,
            refreshToken: {
              token: session.refreshToken,
              expiresAt: fakeExpiresAt
            }
          }
        )

      })
    })

})