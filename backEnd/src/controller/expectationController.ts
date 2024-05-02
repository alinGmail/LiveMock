import express, { NextFunction, Request, Response } from "express";
import { getExpectationCollection, getExpectationDb } from "../db/dbManager";
import { addCross, ServerError, toAsyncRouter } from "./common";
import bodyParser from "body-parser";
import {
  CreateExpectationPathParam,
  CreateExpectationReqBody,
  CreateExpectationReqQuery,
  DeleteExpectationPathParam,
  DeleteExpectationReqBody,
  DeleteExpectationReqQuery,
  GetExpectationPathParam,
  GetExpectationReqBody,
  GetExpectationReqQuery,
  ListExpectationPathParam,
  ListExpectationReqBody,
  ListExpectationReqQuery,
  UpdateExpectationPathParam,
  UpdateExpectationReqBody,
  UpdateExpectationReqQuery,
} from "core/struct/params/ExpectationParams";
import {
  CreateExpectationResponse,
  DeleteExpectationResponse,
  GetExpectationResponse,
  ListExpectationResponse,
  UpdateExpectationResponse,
} from "core/struct/response/ExpectationResponse";
import { logViewEventEmitter } from "../common/logViewEvent";

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
        CreateExpectationResponse,
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
      const collection = await getExpectationCollection(projectId, path);
      if (req.body.expectation) {
        const resExp = collection.insert(req.body.expectation);
        logViewEventEmitter.emit("insertExpectation", { projectId, resExp });
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
      const collection = await getExpectationCollection(projectId, path);
      const expectations = collection.find({}).reverse();
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
        DeleteExpectationPathParam,
        DeleteExpectationResponse,
        DeleteExpectationReqBody,
        DeleteExpectationReqQuery
      >,
      res: Response<DeleteExpectationResponse>
    ) => {
      addCross(res);
      const expectationId = req.params.expectationId;
      const projectId = req.query.projectId;

      if (!projectId) {
        throw new ServerError(400, "project id not exist!");
      }
      const collection = await getExpectationCollection(projectId, path);
      const expectation = collection.findOne({ id: expectationId });
      if (!expectation) {
        throw new ServerError(500, "expectation not exist");
      }
      collection.remove(expectation);
      logViewEventEmitter.emit("deleteExpectation", { projectId, expectation });
      res.json({ message: "success" });
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
        UpdateExpectationPathParam,
        UpdateExpectationResponse,
        UpdateExpectationReqBody,
        UpdateExpectationReqQuery
      >,
      res: Response<UpdateExpectationResponse>
    ) => {
      addCross(res);
      const projectId = req.body.projectId;
      if (!projectId) {
        throw new ServerError(400, "project id not exist!");
      }
      const collection = await getExpectationCollection(projectId, path);
      const expectationId = req.params.expectationId;
      const expectation = collection.findOne({ id: expectationId });
      if (!expectation) {
        throw new ServerError(500, "expectation not exist");
      }
      Object.assign(expectation, req.body.expectationUpdate);
      const result = collection.update(expectation);
      logViewEventEmitter.emit("updateExpectation", { projectId, expectation });
      res.json(result);
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
        GetExpectationPathParam,
        GetExpectationResponse,
        GetExpectationReqBody,
        GetExpectationReqQuery
      >,
      res: Response<GetExpectationResponse>
    ) => {
      addCross(res);
      const projectId = req.query.projectId;
      if (!projectId) {
        throw new ServerError(400, "project id not exist!");
      }
      const expectationId = req.params.expectationId;
      const collection = await getExpectationCollection(projectId, path);
      const expectation = collection.findOne({ id: expectationId });
      if (!expectation) {
        throw new ServerError(500, "expectation not exist");
      }
      res.json(expectation);
    }
  );

  return router;
}
