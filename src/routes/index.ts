import { Router } from "express";
import authRouter from "./auth.js";

const appRouter = Router();

const appRoutes = [
    { path: "/auth", router: authRouter },
]

appRoutes.forEach(route => {
    appRouter.use(route.path, route.router);
});

export default appRouter;