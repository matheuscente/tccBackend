import express, { Router } from "express"
import heathCheckRoute from "../health-check.route/health-check.route"
import { userRoutes } from "../../modules/users/routes/user.routes"
import { authRoutes } from "../../modules/auth/routes/auth.routes"
import { courseRoutes } from "../../modules/courses/routes/courses.routes"
import { moduleRoutes } from "../../modules/modules/routes/module.routes"
import { disciplineRoutes } from "../../modules/disciplines/routes/discipline.routes"
import { goalRoutes } from "../../modules/goals/routes/goal.routes"
import { studySessionRoutes } from "../../modules/study-sessions/routes/study-session.routes"
import { questionRoutes } from "../../modules/questions/routes/question.routes"
import { activityRoutes } from "../../modules/activities/routes/activity.routes"
import { noteRoutes } from "../../modules/notes/routes/note.routes"
import { fileRoutes } from "../../modules/files/routes/file.routes"
import { ticketRoutes } from "../../modules/tickets/routes/ticket.routes"
import { statsRoutes } from "../../modules/stats/routes/stats.routes"
import { adminRoutes } from "../../modules/admin/routes/admin.routes"
import { docsRoutes } from "../docs/docs.routes"


// função responsável por organizar e contralizar as rotas.
export const routes = (app: express.Express) => {
    
    //determina o app usar JSON em todas as rotas
    app.use(express.json({ limit: "1mb" }))
    app.use(express.urlencoded({ extended: false, limit: "1mb" }))

    //instancia do router do express
    const api = Router()
    //quando adicionar uma rota, usar a instancia do router.

    //determina o caminho padrão das rotas com a instancia do router.
    app.use('/api/v1', api)

    api.use('/health', heathCheckRoute)

    api.use('/users', userRoutes)

    api.use('/auth', authRoutes)

    api.use('/courses', courseRoutes)

    api.use('/modules', moduleRoutes)

    api.use('/disciplines', disciplineRoutes)

    api.use('/goals', goalRoutes)

    api.use('/study-sessions', studySessionRoutes)

    api.use('/questions', questionRoutes)

    api.use('/activities', activityRoutes)

    api.use('/notes', noteRoutes)

    api.use('/files', fileRoutes)

    api.use('/tickets', ticketRoutes)

    api.use('/stats', statsRoutes)

    api.use('/admin', adminRoutes)

    api.use('/docs', docsRoutes)

}