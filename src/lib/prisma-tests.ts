import { PrismaClient } from "@prisma/client";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not defined for tests");
}

export const prismaTests = new PrismaClient();