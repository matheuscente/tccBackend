import type { GenerateAccessTokenDTO } from "../../modules/auth/DTOs/generate-access-token.dto";

  export const makePayload = (
    overrides?: Partial<GenerateAccessTokenDTO>,
  ): GenerateAccessTokenDTO => ({
    sub: "user-1",
    sessionId: "session-1",
    ...overrides,
  });
