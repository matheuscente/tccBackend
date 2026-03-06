import type { User } from "@prisma/client";
import type { AuthUserDTO } from "../../shared/DTOs/auth-user.DTO";
import type { IUserRepository } from "../../modules/users/interfaces/user-repository.interface";
import { AuthorizationError } from "../errors/authorization.error";
import { NotFoundError } from "../errors/not-found-error";

export class OwnershipService {
    constructor(
        private readonly userRepository: IUserRepository
    ) { }

    async resolveOwnerId(
        authUser: AuthUserDTO,
        userId?: string
    ): Promise<string> {
        if (authUser.role === "ADMIN") {
            if (userId && userId !== authUser.id) {
                const userExists = await this.userRepository.findById(userId);
                if (!userExists) {
                    throw new NotFoundError("Usuário não encontrado");
                }
                return userId;
            }
            return authUser.id;
        }

        if (userId && userId !== authUser.id) {
            throw new AuthorizationError("Ação não autorizada");
        }

        return authUser.id;
    }

    validateOwnership(
        user: Pick<User, "id" | "role">,
        ownerId: string,
    ): void {
        if (user.role !== "ADMIN" && user.id !== ownerId) {
            throw new AuthorizationError("Ação não autorizada");
        }
    }

    validateStrictOwnership(
        user: Pick<User, "id">,
        ownerId: string,
    ): void {
        if (user.id !== ownerId) {
            throw new AuthorizationError("Ação não autorizada");
        }
    }
}