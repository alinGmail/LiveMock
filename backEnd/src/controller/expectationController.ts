import express, {NextFunction, Request, Response} from "express";
import { getExpectationDb } from "../db/dbManager";
import { addCross, ServerError } from "./common";
import bodyParser from "body-parser";
import { CreateExpectationParam } from "core/struct/params/ExpectationParams";
import { ExpectationM } from "core/struct/expectation";

export function getExpectationRouter(path: string): express.Router {
  let router = express();
  router.options("*", (req, res) => {
    addCross(res);
    res.end();
  });
  /**
   * create expectation
   */
  router.post(
    "/",
    bodyParser.json(),
    async (
      req: Request<{}, {}, CreateExpectationParam>,
      res: Response<ExpectationM>,
      next:NextFunction
    ) => {
      try{
        addCross(res);
        const projectId = req.body.projectId;
        if (!projectId) {
          throw new ServerError(400, "project id not exist!");
        }
        let expectationP = getExpectationDb(projectId, path);
        if (req.body.expectation) {
          const insertPromise = await expectationP.insertPromise(
              req.body.expectation
          );
          res.json(insertPromise);
        } else {
          throw new ServerError(400, "expectation not exist!");
        }
      }catch (err){
        next(err);
      }


    }
  );

  router.get(
    "/",
    async (req: Request<{}, {}, {}, { projectId: string }>, res) => {
      const projectId = req.query.projectId;
      if (!projectId) {
        throw new ServerError(400, "project id not exist!");
      }
      getExpectationDb(projectId, path);
    }
  );

  return router;
}
