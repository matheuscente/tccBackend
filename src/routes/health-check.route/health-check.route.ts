import express from "express"
import {prisma} from "../../lib/prisma"

const heathCheckRoute = express.Router()

heathCheckRoute.get("/", async (req, res) => {
    await prisma.$connect()
    res.status(200)on({database: "conectado com sucesso"})
})

export default heathCheckRoute