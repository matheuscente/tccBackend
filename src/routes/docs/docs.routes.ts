import express from "express"
import swaggerUi from "swagger-ui-express"
import { openApiDocument } from "./openapi"

export const docsRoutes = express.Router()

docsRoutes.get("/openapi.json", (_req, res) => {
    res.json(openApiDocument)
})

docsRoutes.use("/", swaggerUi.serve, swaggerUi.setup(openApiDocument, {
    customSiteTitle: "Organizador de Estudos - API"
}))
