import express, { Request, Response } from "express";
import { addCross, ServerError, toAsyncRouter } from "./common";
import bodyParser from "body-parser";
import {
  CreateMatcherPathParam,
  CreateMatcherReqBody,
  DeleteMatcherPathParam,
  DeleteMatcherReqBody,
  DeleteMatcherReqQuery,
  UpdateMatcherPathParam,
  UpdateMatcherReqBody,
  UpdateMatcherReqQuery,
} from "core/struct/params/MatcherParams";
import {
  CreateMatcherResponse,
  DeleteMatcherResponse,
  UpdateMatcherResponse,
} from "core/struct/response/MatcherResponse";
import {getExpectationCollection} from "../db/dbManager";


export function getMatcherRouter(path: string): express.Router {
  let router = toAsyncRouter(express());
  router.options("*", (req, res) => {
    addCross(res);
    res.end();
  });
  /**
   * create matcher
   */
  router.post(
    "/",
    bodyParser.json(),
    async (
      req: Request<
        CreateMatcherPathParam,
        CreateMatcherResponse,
        CreateMatcherReqBody
      >,
      res: Response<CreateMatcherResponse>
    ) => {
      addCross(res);
      let { expectationId, matcher, projectId } = req.body;
      if (!projectId) {
        throw new ServerError(400, "project id not exist!");
      }
      if (!matcher) {
        throw new ServerError(400, "invalid params!");
      }
      const collection = await getExpectationCollection(projectId, path);
      const expectation = collection.findOne({ id: expectationId });
      if (!expectation) {
        throw new ServerError(500, "expectation not exist");
      }
      expectation.matchers.push(matcher);
      collection.update(expectation);
      res.json(matcher);
    }
  );

  /**
   * delete matcher
   */
  router.delete(
    "/:matcherId",
    bodyParser.json(),
    async (
      req: Request<
        DeleteMatcherPathParam,
        DeleteMatcherResponse,
        DeleteMatcherReqBody,
        DeleteMatcherReqQuery
      >,
      res: Response<DeleteMatcherResponse>
    ) => {
      addCross(res);
      let { expectationId, projectId } = req.query;
      if (!projectId) {
        throw new ServerError(400, "project id not exist!");
      }
      const collection = await getExpectationCollection(projectId, path);
      const expectation = collection.findOne({ id: expectationId });
      if (!expectation) {
        throw new ServerError(500, "expectation not exist");
      }
      expectation.matchers = expectation.matchers.filter(
        (item) => item.id !== req.params.matcherId
      );
      collection.update(expectation);
      res.json({ message: "operation success" });
    }
  );

  /**
   * update matcher
   */
  router.put(
    "/:matcherId",
    bodyParser.json(),
    async (
      req: Request<
        UpdateMatcherPathParam,
        UpdateMatcherResponse,
        UpdateMatcherReqBody,
        UpdateMatcherReqQuery
      >,
      res: Response<UpdateMatcherResponse>
    ) => {
      addCross(res);
      let { expectationId, projectId, matcherUpdate } = req.body;
      let matcherId = req.params.matcherId;
      if (!projectId) {
        throw new ServerError(400, "project id not exist!");
      }
      const collection = await getExpectationCollection(projectId, path);
      const expectation = collection.findOne({ id: expectationId });
      if (!expectation) {
        throw new ServerError(500, "expectation not exist");
      }

      const matcher = expectation.matchers.find(item => item.id === matcherId);
      if(!matcher){
        throw new ServerError(500, "matcher not exist");
      }
      Object.assign(matcher,matcherUpdate);
      collection.update(expectation);
      res.json(matcher);
    }
  );

  return router;
}
