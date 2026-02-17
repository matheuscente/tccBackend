import { randomUUID } from "crypto";
import { NotFoundError } from "../../../shared/errors/not-found-error";
import type { IHashProvider } from "../../../shared/hash/interfaces/hash-provider.interface";
import type { SessionResponseDTO } from "../DTOs/session-response.DTO";
import type { ISessionRepository } from "../interfaces/repositories/session-repository.interface";
import type { ISessionService } from "../interfaces/services/session-service.interface";
import { ValidationError } from "../../../shared/errors/validation-error";
import type { Session } from "@prisma/client";

export class SessionService implements ISessionService {
  constructor(
    private readonly repository: ISessionRepository,
    private readonly hash: IHashProvider,
  ) {}

  async createSession(userId: string): Promise<SessionResponseDTO> {
    //SECRET KEY
    const secret = randomUUID();

    //secret key hash
    const hashedSecret = await this.hash.hash(secret);

    //refresh token duration
    const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 7);

    //create session in database
    //The refresh token sent to the database is the secret hashed
    const session = await this.repository.create({
      userId,
      refreshToken: hashedSecret,
      expiresAt,
    });

    //The refresh token sent to the client is session id and secret unhashed
    return {
      id: session.id,
      userId: session.userId,
      refreshToken: `${session.id}.${secret}`,
      expiresAt: session.expiresAt,
    };
  }

  async refreshSession(refreshToken: string): Promise<SessionResponseDTO> {
    //separates the parts of the refresh token coming from the client.
    const [sessionId, secret] = refreshToken.split(".");

    if (!sessionId || !secret)
      throw new ValidationError("Refresh token inválido");

    const session: Session | null = await this.repository.findById(sessionId);

    if (!session || !session.isValid)
      throw new ValidationError("Sessão inválida");

    //If the session expiration date is earlier than the current date, the session will be invalidated.
    if (session.expiresAt < new Date()) {
      await this.repository.invalidate(sessionId);
      throw new ValidationError("Session expirada");
    }

    //Compare client unhashed secret with database hashed secret
    const isMatch = await this.hash.compare(secret, session.refreshToken);
    if (!isMatch) throw new ValidationError("Refresh token inválido");

    const newSecret = randomUUID();

    //secret key hash
    const newHashedSecret = await this.hash.hash(newSecret);

    const newExpiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 7);

    await this.repository.update(sessionId, {
      refreshToken: newHashedSecret,
      expiresAt: newExpiresAt,
    });

    return {
      id: session.id,
      userId: session.userId,
      refreshToken: `${sessionId}.${newSecret}`,
      expiresAt: newExpiresAt,
    };
  }

  async invalidateSession(sessionId: string): Promise<void> {
    const session = await this.repository.findById(sessionId);

    if (!session) throw new NotFoundError("sessão não encontrada");

    if (!session?.isValid) return;

    return this.repository.invalidate(sessionId);
  }
}
