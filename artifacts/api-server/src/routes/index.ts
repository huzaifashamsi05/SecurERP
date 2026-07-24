import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import dashboardRouter from "./dashboard";
import usersRouter from "./users";
import guardsRouter from "./guards";
import clientsRouter from "./clients";
import operationsRouter from "./operations";
import hrRouter from "./hr";
import financeRouter from "./finance";
import assetsRouter from "./assets";
import notificationsRouter from "./notifications";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(dashboardRouter);
router.use(usersRouter);
router.use(guardsRouter);
router.use(clientsRouter);
router.use(operationsRouter);
router.use(hrRouter);
router.use(financeRouter);
router.use(assetsRouter);
router.use(notificationsRouter);

export default router;
