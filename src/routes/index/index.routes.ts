import express, { Router } from "express"
import heathCheckRoute from "../health-check.route/health-check.route.js"


// função responsável por organizar e contralizar as rotas.
export const routes = (app: express.Express) => {
    
    //determina o app usar JSON em todas as rotas
    app.use(express.json())

    //instancia do router do express
    const api = Router()
    //quando adicionar uma rota, usar a instancia do router.

    //determina o caminho padrão das rotas com a instancia do router.
    app.use('/api/v1', api)

    api.use('/health', heathCheckRoute)

}