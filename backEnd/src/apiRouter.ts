import express from "express";
import { getProjectRouter } from "./controller/projectController";
import { getGroupRouter } from "./controller/expectationGroupController";
import { getExpectationRouter } from "./controller/expectationController";
import { CustomErrorMiddleware } from "./controller/common";
import { getMatcherRouter } from "./controller/matcherController";
import { getActionRouter } from "./controller/actionController";
import { getLogRouter } from "./controller/logController";
import { getLogFilterRouter } from "./controller/logFilterController";
import { getAuthRouter } from "./controller/authController";
import { originCheck, requireAuth } from "./controller/authMiddleware";
import { LoginThrottle } from "./auth/loginThrottle";

/**
 * Compose the complete /api router: all feature routers plus the global error
 * middleware. Exported so tests can mount the real composition at the highest
 * possible seam, and so authentication middleware can be added in one place.
 */
export async function getApiRouter(dbPath: string): Promise<express.Router> {
  const apiRouter = express.Router();
  const throttle = new LoginThrottle();
  apiRouter.use(originCheck());
  apiRouter.use("/auth", getAuthRouter(dbPath, throttle));
  apiRouter.use(requireAuth(dbPath));
  apiRouter.use("/project", await getProjectRouter(dbPath));
  apiRouter.use("/group", getGroupRouter(dbPath));
  apiRouter.use("/expectation", getExpectationRouter(dbPath));
  apiRouter.use("/matcher", getMatcherRouter(dbPath));
  apiRouter.use("/action", await getActionRouter(dbPath));
  apiRouter.use("/logFilter", await getLogFilterRouter(dbPath));
  apiRouter.use("/log", await getLogRouter(dbPath));
  apiRouter.use(CustomErrorMiddleware);
  return apiRouter;
}
