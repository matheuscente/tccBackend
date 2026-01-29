import "dotenv/config";
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '../../generated/prisma/client.js'

const connectionString = `${process.env.TEST_DATABASE_URL}`

const adapter = new PrismaPg({ connectionString })
const prismaTests = new PrismaClient({ adapter })

export { prismaTests }