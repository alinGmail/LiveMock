import express, { Request, Response } from "express";
import { getExpectationDb } from "../db/dbManager";
import {addCross, ServerError} from "./common";
import bodyParser from "body-parser";
import { CreateExpectationParam } from "core/struct/params/ExpectationParams";

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
    (req: Request<{}, {}, CreateExpectationParam>, res: Response<string>) => {
      let expectationP = getExpectationDb(req.body.projectId, path);
      addCross(res);
      if (req.body.expectation) {
        expectationP.getDb().insert(req.body.expectation);
      }
      res.end("success");
    }
  );

  router.get(
    "/",
    async (req: Request<{}, {}, {}, { projectId: string }>, res) => {
      const projectId = req.query.projectId;
      if(!projectId){
          throw new ServerError(400,'project id not exist!');
      }
      getExpectationDb(projectId,path);
    }
  );

  return router;
}
