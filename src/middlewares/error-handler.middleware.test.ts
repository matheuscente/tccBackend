import { Prisma } from "@prisma/client";
import { ErrorHandler } from "./error-handler.middleware";
import { ForbiddenError } from "../shared/errors/forbidden.error";

describe("ErrorHandler", () => {

  const makeSut = () => {
    const app = { use: jest.fn() } as any;
    ErrorHandler.handler(app);
    const handler = app.use.mock.calls[0][0];

    const res = {
      headersSent: false,
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    } as any;

    return { handler, res };
  };

  const prismaError = (code: string) => new Prisma.PrismaClientKnownRequestError("prisma error", { code, clientVersion: "test" });

  it("should respond 404 when the record was removed before the write (P2025)", () => {
    const { handler, res } = makeSut();

    handler(prismaError("P2025"), {}, res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 404, state: "error" }));
  });

  it("should respond 400 on unique constraint violations (P2002)", () => {
    const { handler, res } = makeSut();

    handler(prismaError("P2002"), {}, res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(400);
  });

  it("should respond 403 for ForbiddenError", () => {
    const { handler, res } = makeSut();

    handler(new ForbiddenError(), {}, res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(403);
  });

  it("should respond 500 for unexpected errors", () => {
    const consoleSpy = jest.spyOn(console, "error").mockImplementation(() => undefined);
    const { handler, res } = makeSut();

    handler(new Error("boom"), {}, res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(500);
    consoleSpy.mockRestore();
  });
});
