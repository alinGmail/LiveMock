import express, { Request } from "express";
import { getExpectationDb } from "../db/dbManager";
import { addCross } from "./common";
import bodyParser from "body-parser";
import { ExpectationM } from "core/struct/expectation";

export function getExpectationRouter(path: string): express.Router {
  let router = express();
  router.options("*", (req, res) => {
    addCross(res);
    res.end();
  });

  router.post(
    "/",
    bodyParser.json(),
    (
      req: Request<
        {},
        {},
        {
          expectation: ExpectationM;
          projectId: string;
        }
      >,
      res
    ) => {
      let expectationP = getExpectationDb(req.body.projectId, path);
      addCross(res);
      if (req.body.expectation) {
        expectationP.getDb().insert(req.body.expectation);
      }
      res.end("success");
    }
  );




  return router;
}
