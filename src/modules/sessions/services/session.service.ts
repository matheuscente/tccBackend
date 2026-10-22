import { randomUUID } from "crypto";
import { NotFoundError } from "../../../shared/errors/not-found-error";
import type { IHashProvider } from "../../../shared/hash/interfaces/hash-provider.interface";
import type { SessionResponseDTO } from "../DTOs/session-response.DTO";
import type { ISessionRepository } from "../interfaces/repositories/session-repository.interface";
import type { ISessionService } from "../interfaces/services/session-service.interface";
import { AuthorizationError } from "../../../shared/errors/authorization.error";
import type { ValidateSessionResponseDTO } from "../DTOs/validate-session-response.DTO";
import type { SessionWithUserDTO } from "../DTOs/session-with-user.DTO";

const REFRESH_GRACE_MS = 60 * 1000;

export class SessionService implements ISessionService {
  constructor(
    private readonly repository: ISessionRepository,
    private readonly hash: IHashProvider,
  ) {}

  // o refresh token enviado ao cliente é "<id da sessão>.<segredo>"; o banco guarda apenas o hash do segredo
  async createSession(userId: string): Promise<SessionResponseDTO> {
    const secret = randomUUID();

    const hashedSecret = await this.hash.hash(secret);

    const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 7);

    const session = await this.repository.create({
      userId,
      refreshToken: hashedSecret,
      expiresAt,
    });

    return {
      id: session.id,
      userId: session.userId,
      refreshToken: `${session.id}.${secret}`,
      expiresAt: session.expiresAt,
    };
  }

  async refreshSession(refreshToken: string): Promise<SessionResponseDTO> {
    const [sessionId, secret] = refreshToken.split(".");

    if (!sessionId || !secret)
      throw new AuthorizationError("Refresh token inválido");

    const session: SessionWithUserDTO | null = await this.repository.findByIdWithUser(sessionId);
    if (!session || !session.isValid)
      throw new AuthorizationError("Sessão inválida");

    if (session.user.deletedAt) throw new AuthorizationError("Usuário desativado")

    if (session.expiresAt < new Date()) {
      await this.repository.invalidate(sessionId);
      throw new AuthorizationError("Sessão expirada");
    }

    const isMatch = await this.hash.compare(secret, session.refreshToken);

    if (!isMatch) {
      // o token anterior continua válido por alguns segundos após a rotação (abas simultâneas ou resposta perdida)
      const withinGrace = !!session.previousRefreshToken && !!session.rotatedAt &&
        Date.now() - session.rotatedAt.getTime() <= REFRESH_GRACE_MS;

      const isPrevious = withinGrace && await this.hash.compare(secret, session.previousRefreshToken!);

      if (!isPrevious) throw new AuthorizationError("Refresh token inválido");
    }

    const newSecret = randomUUID();

    const newHashedSecret = await this.hash.hash(newSecret);

    const newExpiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 7);

    await this.repository.update(sessionId, {
      refreshToken: newHashedSecret,
      expiresAt: newExpiresAt,
      previousRefreshToken: session.refreshToken,
      rotatedAt: new Date(),
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

  async invalidateAllByUserId(userId: string): Promise<void> {
    await this.repository.invalidateAllByUserId(userId)
}

  async validateSession(sessionId: string): Promise<ValidateSessionResponseDTO> {
    const session = await this.repository.findByIdWithUser(sessionId)

    if(!session || !session.isValid || session.expiresAt.getTime() < new Date().getTime()) throw new AuthorizationError("Sessão inválida ou não encontrada")
    
    if(session.user.deletedAt) throw new AuthorizationError("Usuário desativado")

      return {
        userId: session.user.id,
        userRole: session.user.role,

      }


  }
}
