/**
 * Cria (ou promove) o usuário administrador a partir das variáveis ADMIN_* do .env.
 * Uso: npm run seed
 */
import "dotenv/config"
import bcrypt from "bcrypt"
import { PrismaClient } from "@prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }) })

const main = async () => {
    const username = (process.env.ADMIN_USERNAME ?? "admin").trim().toLowerCase()
    const email = (process.env.ADMIN_EMAIL ?? "admin@organizador.local").trim().toLowerCase()
    const password = process.env.ADMIN_PASSWORD ?? "Admin12345"
    const name = (process.env.ADMIN_NAME ?? "ADMINISTRADOR").trim().toUpperCase()

    const existing = await prisma.user.findFirst({ where: { username, deletedAt: null } })

    if (existing) {
        await prisma.user.update({ where: { id: existing.id }, data: { role: "ADMIN" } })
        console.log(`Usuário "${username}" já existia e agora é administrador.`)
        return
    }

    await prisma.user.create({
        data: {
            name,
            username,
            email,
            password: await bcrypt.hash(password, 10),
            birthDate: new Date(Date.UTC(1990, 0, 1)),
            role: "ADMIN"
        }
    })

    console.log(`Administrador criado: usuário "${username}" / senha definida em ADMIN_PASSWORD.`)
}

main()
    .catch(err => {
        console.error(err)
        process.exitCode = 1
    })
    .finally(() => prisma.$disconnect())
