import { Router, type IRouter } from "express";
import healthRouter from "./health";
import swapRouter from "./swap";
import transactionsRouter from "./transactions";
import bridgeRouter from "./bridge";

const router: IRouter = Router();

router.use(healthRouter);
router.use(swapRouter);
router.use(transactionsRouter);
router.use(bridgeRouter);

export default router;
