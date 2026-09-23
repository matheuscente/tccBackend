import express from "express"
import { database } from "../../database/database-config"

const heathCheckRoute = express.Router()

heathCheckRoute.get("/", async (req, res) => {
    try {
        await database.connectionTest()
        res.status(200).json({database: "conectado com sucesso"})
    } catch(err) {
        console.log(err)
        res.status(500).json({Erro: "Erro interno no servidor"})
    }
})

export default heathCheckRoute