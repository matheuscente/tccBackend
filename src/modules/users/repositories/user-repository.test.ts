import { describe } from "node:test";
import { prismaTests } from "../../../lib/prisma-tests.js";
import { UserRepository } from "./user.repository.js";

describe('UserRepository tests', () => {
    const repository = new UserRepository(prismaTests)

    beforeAll(async () => {
        await prismaTests.$connect()
    })

    afterAll(async () => {
        await prismaTests.$disconnect()
    })

    afterEach(async () => {
        await prismaTests.user.deleteMany()
    })



})