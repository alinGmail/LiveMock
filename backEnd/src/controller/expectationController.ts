import express, { NextFunction, Request, Response } from "express";
import { getExpectationDb } from "../db/dbManager";
import { addCross, ServerError, toAsyncRouter } from "./common";
import bodyParser from "body-parser";
import {
  CreateExpectationPathParam,
  CreateExpectationReqBody,
  CreateExpectationReqQuery,
  ExpectationDetailParam,
  ListExpectationPathParam,
  ListExpectationReqBody,
  ListExpectationReqQuery,
  UpdateExpectationParam,
} from "core/struct/params/ExpectationParams";
import { ExpectationM } from "core/struct/expectation";
import {
  CreateExpectationResponse,
  DeleteExpectationResponse,
  ExpectationDetailResponse,
  ListExpectationResponse,
  UpdateExpectationResponse,
} from "core/struct/response/ExpectationResponse";
import { Collection } from "lokijs";

async function getCollection(
  projectId: string,
  path: string
): Promise<Collection<ExpectationM>> {
  const db = await getExpectationDb(projectId, path);
  return db.getCollection("expectation");
}

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
      req: Request<
        CreateExpectationPathParam,
        {},
        CreateExpectationReqBody,
        CreateExpectationReqQuery
      >,
      res: Response<CreateExpectationResponse>
    ) => {
      addCross(res);
      const projectId = req.body.projectId;
      if (!projectId) {
        throw new ServerError(400, "project id not exist!");
      }
      const collection = await getCollection(projectId, path);
      if (req.body.expectation) {
        const resExp = collection.insert(req.body.expectation);
        res.json(resExp);
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
      req: Request<
        ListExpectationPathParam,
        ListExpectationResponse,
        ListExpectationReqBody,
        ListExpectationReqQuery
      >,
      res: Response<ListExpectationResponse>
    ) => {
      addCross(res);
      const projectId = req.query.projectId;
      if (!projectId) {
        throw new ServerError(400, "project id not exist!");
      }
      const collection = await getCollection(projectId,path);
      const expectations = collection.find({});
      res.json(expectations);
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
