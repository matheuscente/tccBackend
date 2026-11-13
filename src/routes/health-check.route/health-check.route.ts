import express from "express"
import {prisma} from "../../lib/prisma"

const heathCheckRoute = express.Router()

heathCheckRoute.get("/", async (_req, res) => {
    let database: "conectado" | "indisponível" = "conectado"

    try {
        await prisma.$queryRaw`SELECT 1`
    } catch {
        database = "indisponível"
    }

    res.status(200).json({
        status: "ok",
        uptime: `${Math.round(process.uptime())}s`,
        database
    })
})

export default heathCheckRoute
