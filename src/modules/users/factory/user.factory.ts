import { Hash } from "../../../shared/hash/hash-utils";
import { UserController } from "../controllers/user.controller";
import { UserRepository } from "../repositories/user.repository";
import { UserService } from "../services/user.service";
import { prisma } from "../../../lib/prisma"
import { Sanitize } from "../../../shared/sanitize/sanitize.utils";

export function userFactory(): UserController {
  const repository = new UserRepository(prisma);
  const hasher = new Hash(10);
  const sanitize = new Sanitize()

  const service = new UserService(repository, hasher, sanitize);
  const controller = new UserController(service);

  return controller;
}