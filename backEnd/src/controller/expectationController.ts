import express, { NextFunction, Request, Response } from "express";
import { getExpectationDb } from "../db/dbManager";
import { addCross, ServerError, toAsyncRouter } from "./common";
import bodyParser from "body-parser";
import {
  CreateExpectationParam,
  ExpectationDetailParam,
  UpdateExpectationParam,
} from "core/struct/params/ExpectationParams";
import { ExpectationM } from "core/struct/expectation";
import {
  DeleteExpectationResponse,
  ExpectationDetailResponse,
  ListExpectationResponse,
  UpdateExpectationResponse,
} from "core/struct/response/ExpectationResponse";

export function getExpectationRouter(path: string): express.Router {
  let router = toAsyncRouter(express());
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
      next: NextFunction
    ) => {
      addCross(res);
      const projectId = req.body.projectId;
      if (!projectId) {
        throw new ServerError(400, "project id not exist!");
      }
      let expectationP = getExpectationDb(projectId, path);
      if (req.body.expectation) {
       /* const insertPromise = await expectationP.insertPromise(
          req.body.expectation
        );
        res.json(insertPromise);*/
      } else {
        throw new ServerError(400, "expectation not exist!");
      }
    }
  );

  /**
   * list expectation
   */
  router.get(
    "/",
    async (
      req: Request<{}, {}, {}, { projectId: string }>,
      res: Response<ListExpectationResponse>
    ) => {
      addCross(res);
      const projectId = req.query.projectId;
      if (!projectId) {
        throw new ServerError(400, "project id not exist!");
      }
      const expectationDb = getExpectationDb(projectId, path);
      //let expectations = await expectationDb.findPromise({});
      //res.json(expectations);
    }
  );

  /**
   * delete expectation
   */
  router.delete(
    "/:expectationId",
    async (
      req: Request<
        {
          expectationId: string;
        },
        {},
        {},
        {
          projectId: string;
        }
      >,
      res: Response<DeleteExpectationResponse>
    ) => {
      addCross(res);
      const expectationId = req.params.expectationId;
      const projectId = req.query.projectId;
      const expectationDb = getExpectationDb(projectId, path);
      if (!projectId) {
        throw new ServerError(400, "project id not exist!");
      }
      // let removeNum = await expectationDb.removePromise({ _id: expectationId });
      let removeNum = 0;
      if (removeNum >= 1) {
        res.json({ message: "operation success" });
      } else {
        throw new ServerError(500, "delete fail");
      }
    }
  );

  /**
   * update expectation
   */
  router.put(
    "/:expectationId",
    bodyParser.json(),
    async (
      req: Request<
        {
          expectationId: string;
        },
        {},
        UpdateExpectationParam
      >,
      res: Response<UpdateExpectationResponse>
    ) => {
      addCross(res);
      const projectId = req.body.projectId;
      if (!projectId) {
        throw new ServerError(400, "project id not exist!");
      }
      const expectationDb = getExpectationDb(projectId, path);
      const expectationId = req.params.expectationId;

     /* let updateRes = await expectationDb.updatePromise(
        {
          _id: expectationId,
        },
        req.body.updateQuery
      );*/
      res.json({ message: "operation success" });
    }
  );

  /**
   * get expectation
   */
  router.get(
    "/:expectationId",
    bodyParser.json(),
    async (
      req: Request<
        {
          expectationId: string;
        },
        {},
        ExpectationDetailParam,
        { projectId: string }
      >,
      res: Response<ExpectationDetailResponse>
    ) => {
      addCross(res);
      const projectId = req.query.projectId;
      if (!projectId) {
        throw new ServerError(400, "project id not exist!");
      }
      const expectationDb = getExpectationDb(projectId, path);
      const expectationId = req.params.expectationId;
      //const result = await expectationDb.findOnePromise({ _id: expectationId });
      //res.json(result);
    }
  );

  return router;
}
