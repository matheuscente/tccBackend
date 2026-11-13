import jwt from "jsonwebtoken";
import { AuthorizationError } from "../../errors/authorization.error";
import { FileTokenService } from "./file-token.service";

describe("FileTokenService", () => {
  const secret = "segredo-de-teste";
  const service = new FileTokenService(secret);

  afterEach(() => {
    jest.useRealTimers();
  });

  it("deve assinar e validar um token do mesmo tipo", () => {
    const token = service.sign({ sub: "file-1", kind: "file" });

    expect(service.verify(token, "file")).toEqual({ sub: "file-1", kind: "file" });
  });

  it("deve recusar token de outro tipo", () => {
    const token = service.sign({ sub: "attachment-1", kind: "attachment" });

    expect(() => service.verify(token, "file")).toThrow(AuthorizationError);
  });

  it("deve recusar token assinado com outro segredo", () => {
    const token = new FileTokenService("outro-segredo").sign({ sub: "file-1", kind: "file" });

    expect(() => service.verify(token, "file")).toThrow("Link do arquivo inválido ou expirado");
  });

  it("deve recusar token alterado", () => {
    const token = service.sign({ sub: "file-1", kind: "file" });
    const [header, , signature] = token.split(".");
    const payload = Buffer.from(JSON.stringify({ sub: "file-2", kind: "file" })).toString("base64url");

    expect(() => service.verify(`${header}.${payload}.${signature}`, "file")).toThrow(AuthorizationError);
  });

  it("deve recusar token sem sub", () => {
    const token = jwt.sign({ kind: "file" }, secret, { algorithm: "HS256" });

    expect(() => service.verify(token, "file")).toThrow(AuthorizationError);
  });

  it("deve recusar token expirado", () => {
    jest.useFakeTimers({ now: new Date("2026-10-30T12:00:00.000Z") });
    const shortLived = new FileTokenService(secret, 60);
    const token = shortLived.sign({ sub: "file-1", kind: "file" });

    jest.setSystemTime(new Date("2026-10-30T12:01:01.000Z"));

    expect(() => shortLived.verify(token, "file")).toThrow(AuthorizationError);
  });

  it("deve recusar algoritmo diferente de HS256", () => {
    const token = jwt.sign({ sub: "file-1", kind: "file" }, secret, { algorithm: "HS512" });

    expect(() => service.verify(token, "file")).toThrow(AuthorizationError);
  });
});
