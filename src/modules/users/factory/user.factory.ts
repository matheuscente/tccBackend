import { HashProvider } from "../../../shared/hash/provider/hash.provider";
import { UserController } from "../controllers/user.controller";
import { UserRepository } from "../repositories/user.repository";
import { UserService } from "../services/user.service";
import { prisma } from "../../../lib/prisma"
import { SanitizeUtils } from "../../../shared/sanitize/utils/sanitize.utils";

export function userFactory(): UserController {
  const repository = new UserRepository(prisma);
  const hasher = new HashProvider(10);
  const sanitize = new SanitizeUtils()

  const service = new UserService(repository, hasher, sanitize);
  const controller = new UserController(service);

  return controller;
}