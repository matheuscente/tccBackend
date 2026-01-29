
import { prismaTests } from "./src/lib/prisma-tests";

beforeAll(async () => {
  await prismaTests.$connect();
});

afterAll(async () => {
  await prismaTests.$disconnect();
});
