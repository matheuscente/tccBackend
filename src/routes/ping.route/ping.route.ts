import express from "express"

// rota leve para monitores externos manterem a API acordada: não acessa o banco
const pingRoute = express.Router()

pingRoute.get("/", (_req, res) => {
    res.status(200).json({ status: "ok" })
})

export default pingRoute
