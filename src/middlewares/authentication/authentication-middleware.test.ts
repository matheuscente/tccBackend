import { authenticationMiddleware } from "./authentication.middleware";

import { AuthorizationError } from "../../shared/errors/authorization.error";
import type { IAccessTokenService } from "../../modules/auth/interfaces/access-token/access-token-service.interface";
import type { ISessionService } from "../../modules/sessions/interfaces/services/session-service.interface";
import { ValidationError } from "../../shared/errors/validation-error";


describe("AuthenticationMiddleware tests", () => {

        //função que cria o sistema que estamos testando
        //ele mocka as dependencias necessárias, instancia o middleware e retorna o middleware e os mocks
    const makeSut = () => {
        const accessTokenServiceMock: jest.Mocked<IAccessTokenService> = {
            extractPayload: jest.fn(),
            generateAccessToken: jest.fn()
        }

        const sessionServiceMock : jest.Mocked<ISessionService> = {
            createSession: jest.fn(),
            refreshSession: jest.fn(),
            invalidateSession: jest.fn(),
            invalidateAllByUserId: jest.fn(),
            validateSession: jest.fn()
        }

        const middleware = authenticationMiddleware(accessTokenServiceMock, sessionServiceMock)

        return {
            middleware,
            accessTokenServiceMock,
            sessionServiceMock
        }
    }

    //mock de request
    const requestMock = (authorization?: string) => ({
        headers: {
            authorization
        }
    }) as any

    //mock de response
    const responseMock = () => ({})  as any

    //mock de next
    const nextMock = jest.fn()  as any

    beforeEach(() => {
        jest.clearAllMocks()
    })


    it("should authenticate successfully", async () => {
        const sessionId = "session-id"

         const { middleware, accessTokenServiceMock, sessionServiceMock } = makeSut()

         accessTokenServiceMock.extractPayload.mockReturnValue({
            sub: "user-id",
            sessionId: sessionId,
            iat: 123,
            exp: 123
         })

         sessionServiceMock.validateSession.mockResolvedValue({
            userId: "user-id",
            userRole: "USER"
         })

         //atribui o header do request
         const req = requestMock("Bearer valid-access-token")

         await middleware(req, responseMock(), nextMock)

         expect(accessTokenServiceMock.extractPayload).toHaveBeenCalledTimes(1)
         expect(accessTokenServiceMock.extractPayload).toHaveBeenCalledWith("valid-access-token")

         expect(sessionServiceMock.validateSession).toHaveBeenCalledTimes(1)
         expect(sessionServiceMock.validateSession).toHaveBeenCalledWith(sessionId)

         expect(req.user).toEqual({
            id: "user-id",
            role: "USER",
            sessionId: "session-id"
         })

        expect(nextMock).toHaveBeenCalledTimes(1)
         expect(nextMock).toHaveBeenCalledWith()

    })

    it("should throw an error because the user ID in the token payload does not match the one in the session.", async () => {
        const sessionId = "session-id"

         const { middleware, accessTokenServiceMock, sessionServiceMock } = makeSut()

         accessTokenServiceMock.extractPayload.mockReturnValue({
            sub: "user-invalid-id",
            sessionId: sessionId,
            iat: 123,
            exp: 123
         })

         sessionServiceMock.validateSession.mockResolvedValue({
            userId: "user-id",
            userRole: "USER"
         })

         //atribui o header do request
         const req = requestMock("Bearer valid-access-token")

         await middleware(req, responseMock(), nextMock)

         expect(accessTokenServiceMock.extractPayload).toHaveBeenCalledTimes(1)
         expect(accessTokenServiceMock.extractPayload).toHaveBeenCalledWith("valid-access-token")

         expect(sessionServiceMock.validateSession).toHaveBeenCalledTimes(1)
         expect(sessionServiceMock.validateSession).toHaveBeenCalledWith(sessionId)

         expect(req.user).toBeUndefined()

         expect(nextMock).toHaveBeenCalledWith(expect.any(AuthorizationError))

    })

    it("should throw an error coming from validateSession.", async () => {
        const sessionId = "session-id"

         const { middleware, accessTokenServiceMock, sessionServiceMock } = makeSut()

         accessTokenServiceMock.extractPayload.mockReturnValue({
            sub: "user-id",
            sessionId: sessionId,
            iat: 123,
            exp: 123
         })

         sessionServiceMock.validateSession.mockRejectedValue(new AuthorizationError("validateSession error"))

         //atribui o header do request
         const req = requestMock("Bearer valid-access-token")

         await middleware(req, responseMock(), nextMock)

         expect(accessTokenServiceMock.extractPayload).toHaveBeenCalledTimes(1)
         expect(accessTokenServiceMock.extractPayload).toHaveBeenCalledWith("valid-access-token")

         expect(sessionServiceMock.validateSession).toHaveBeenCalledTimes(1)
         expect(sessionServiceMock.validateSession).toHaveBeenCalledWith(sessionId)

         expect(req.user).toBeUndefined()

         expect(nextMock).toHaveBeenCalledWith(expect.any(AuthorizationError))

    })

    it("should throw an error because the access token is invalid.", async () => {
        const sessionId = "session-id"

         const { middleware, accessTokenServiceMock, sessionServiceMock } = makeSut()

         accessTokenServiceMock.extractPayload.mockImplementation(() => {throw new ValidationError("invalid token")})

         //atribui o header do request
         const req = requestMock("Bearer invalid-access-token")

         await middleware(req, responseMock(), nextMock)

         expect(accessTokenServiceMock.extractPayload).toHaveBeenCalledTimes(1)
         expect(accessTokenServiceMock.extractPayload).toHaveBeenCalledWith("invalid-access-token")

         expect(sessionServiceMock.validateSession).not.toHaveBeenCalled()

         expect(req.user).toBeUndefined()

         expect(nextMock).toHaveBeenCalledWith(expect.any(ValidationError))

    })

    it("should throw an error because the access token was not provided.", async () => {
        const sessionId = "session-id"

         const { middleware, accessTokenServiceMock, sessionServiceMock } = makeSut()

         //atribui o header do request
         const req = requestMock("Bearer")

         await middleware(req, responseMock(), nextMock)

         expect(accessTokenServiceMock.extractPayload).not.toHaveBeenCalled()

         expect(sessionServiceMock.validateSession).not.toHaveBeenCalled()

         expect(req.user).toBeUndefined()

         expect(nextMock).toHaveBeenCalledWith(expect.any(AuthorizationError))

    })

    it("This should throw an error because the access token is not in bearer format.", async () => {
        const sessionId = "session-id"

         const { middleware, accessTokenServiceMock, sessionServiceMock } = makeSut()

         //atribui o header do request
         const req = requestMock("invalid requisition")

         await middleware(req, responseMock(), nextMock)

         expect(accessTokenServiceMock.extractPayload).not.toHaveBeenCalled()

         expect(sessionServiceMock.validateSession).not.toHaveBeenCalled()

         expect(req.user).toBeUndefined()

         expect(nextMock).toHaveBeenCalledWith(expect.any(AuthorizationError))

    })

    it("This should throw an error because the authorization header was not provided.", async () => {
        const sessionId = "session-id"

         const { middleware, accessTokenServiceMock, sessionServiceMock } = makeSut()

         //atribui o header do request
         const req = requestMock()

         await middleware(req, responseMock(), nextMock)

         expect(accessTokenServiceMock.extractPayload).not.toHaveBeenCalled()

         expect(sessionServiceMock.validateSession).not.toHaveBeenCalled()

         expect(req.user).toBeUndefined()

         expect(nextMock).toHaveBeenCalledWith(expect.any(AuthorizationError))

    })
})