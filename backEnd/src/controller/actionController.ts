import express, { Request, Response } from "express";
import { addCross, ServerError, toAsyncRouter } from "./common";
import { Collection } from "lokijs";
import {getExpectationCollection, getExpectationDb} from "../db/dbManager";
import bodyParser from "body-parser";
import {
  CreateActionPathParam,
  CreateActionReqBody,
  CreateActionReqQuery,
  DeleteActionPathParam,
  DeleteActionReqBody,
  DeleteActionReqQuery,
  UpdateActionPathParam,
  UpdateActionReqBody,
  UpdateActionReqQuery,
} from "core/struct/params/ActionParams";
import {
  CreateActionResponse,
  DeleteActionResponse,
  UpdateActionResponse,
} from "core/struct/response/ActionResponse";
import { ExpectationM } from "core/struct/expectation";



export async function getActionRouter(path: string): Promise<express.Router> {
  let router = toAsyncRouter(express());
  router.options("*", (req, res) => {
    addCross(res);
    res.end();
  });

  /**
   * create action
   */
  router.post(
    "/",
    bodyParser.json(),
    async (
      req: Request<
        CreateActionPathParam,
        CreateActionResponse,
        CreateActionReqBody,
        CreateActionReqQuery
      >,
      res: Response<CreateActionResponse>
    ) => {
      addCross(res);
      let { expectationId, action, projectId } = req.body;
      if (!projectId) {
        throw new ServerError(400, "project id not exist!");
      }
      const collection = await getExpectationCollection(projectId, path);
      const expectation = collection.findOne({ id: expectationId });
      if (!expectation) {
        throw new ServerError(500, "expectation not exist");
      }
      expectation.actions[0] = action;
      collection.update(expectation);
      res.json(action);
    }
  );

  /**
   * update action
   */
  router.put(
    "/:actionId",
    bodyParser.json(),
    async (
      req: Request<
        UpdateActionPathParam,
        UpdateActionResponse,
        UpdateActionReqBody,
        UpdateActionReqQuery
      >,
      res: Response<UpdateActionResponse>
    ) => {
      addCross(res);
      let { expectationId, actionUpdate, projectId } = req.body;
      if (!projectId) {
        throw new ServerError(400, "project id not exist!");
      }
      const collection = await getExpectationCollection(projectId, path);
      const expectation = collection.findOne({ id: expectationId });
      if (!expectation) {
        throw new ServerError(500, "expectation not exist");
      }

      const actionIndex = expectation.actions.findIndex(
        (item) => item.id === req.params.actionId
      );
      if (actionIndex === -1) {
        throw new ServerError(500, "action not exist");
      }
      Object.assign(expectation.actions[actionIndex], actionUpdate);
      collection.update(expectation);
      res.json(expectation.actions[actionIndex]);
    }
  );

  /**
   * delete action
   */
  router.delete(
    "/:actionId",
    bodyParser.json(),
    async (
      req: Request<
        DeleteActionPathParam,
        DeleteActionResponse,
        DeleteActionReqBody,
        DeleteActionReqQuery
      >,
      res: Response<DeleteActionResponse>
    ) => {
      addCross(res);
      let { expectationId, projectId } = req.query;
      if (!projectId) {
        throw new ServerError(400, "project id not exist!");
      }
      const collection = await getExpectationCollection(projectId, path);
      // collection.addDynamicView("aa").data()
      const expectation = collection.findOne({ id: expectationId });
      if (!expectation) {
        throw new ServerError(500, "expectation not exist");
      }

      expectation.actions = expectation.actions.filter(
        (item) => item.id !== req.params.actionId
      );
      collection.update(expectation);
      res.json({ message: "success" });
    }
  );

  return router;
}
