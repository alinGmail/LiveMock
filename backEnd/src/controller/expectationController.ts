import express, { Request, Response } from "express";
import {
  getExpectationCollection,
  getExpectationDb,
  getGroupCollection,
} from "../db/dbManager";
import { ServerError, toAsyncRouter } from "./common";
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
} from "livemock-core/struct/params/ExpectationParams";
import {
  CreateExpectationResponse,
  DeleteExpectationResponse,
  GetExpectationResponse,
  ListExpectationResponse,
  UpdateExpectationResponse,
} from "livemock-core/struct/response/ExpectationResponse";
import { ExpectationM } from "livemock-core/struct/expectation";
import { sortExpectationsByMatchOrder } from "livemock-core/struct/expectationGroup";
import { RequestMatcherType } from "livemock-core/struct/matcher";
import {
  BatchImportReqBody,
  BatchImportResult,
  parseImportContent,
} from "livemock-core/import/index";
import { logViewEventEmitter } from "../common/eventEmitters";

export function getExpectationRouter(path: string): express.Router {
  let router = toAsyncRouter(express());
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
   * batch import expectations (OpenAPI / Swagger / Postman)
   */
  router.post(
    "/batchImport",
    bodyParser.json({ limit: "50mb" }),
    async (
      req: Request<{}, BatchImportResult, BatchImportReqBody>,
      res: Response<BatchImportResult>
    ) => {
      const projectId = req.body && req.body.projectId;
      if (!projectId) {
        throw new ServerError(400, "project id not exist!");
      }
      if (!req.body.content || typeof req.body.content !== "string") {
        throw new ServerError(400, "file content not exist!");
      }
      const options = req.body.options || {};
      let parsed;
      try {
        parsed = await parseImportContent(req.body.content, {
          preserveServerPrefix: options.preserveServerPrefix,
        });
      } catch (error) {
        throw new ServerError(400, errorMessage(error));
      }
      const collection = await getExpectationCollection(projectId, path);
      const index = new Map<string, ExpectationM>();
      collection.find({}).forEach((expectation) => {
        const key = expectationKey(expectation);
        if (!index.has(key)) {
          index.set(key, expectation);
        }
      });

      const toInsert: Array<ExpectationM> = [];
      let created = 0;
      let overwritten = 0;
      let skipped = 0;
      parsed.expectations.forEach(({ expectation }) => {
        const key = expectationKey(expectation);
        const existing = index.get(key);
        if (existing) {
          if (options.overwrite) {
            existing.name = expectation.name;
            existing.matchers = expectation.matchers;
            existing.actions = expectation.actions;
            collection.update(existing);
            logViewEventEmitter.emit("updateExpectation", {
              projectId,
              expectation: existing,
            });
            overwritten++;
          } else {
            skipped++;
          }
          return;
        }
        toInsert.push(expectation);
        index.set(key, expectation);
        created++;
      });
      if (toInsert.length > 0) {
        collection.insert(toInsert);
        toInsert.forEach((expectation) => {
          logViewEventEmitter.emit("insertExpectation", {
            projectId,
            expectation,
          });
        });
      }
      const result: BatchImportResult = {
        format: parsed.format,
        created,
        overwritten,
        skipped,
        failures: parsed.failures,
      };
      res.json(result);
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
      const projectId = req.query.projectId;
      if (!projectId) {
        throw new ServerError(400, "project id not exist!");
      }
      const collection = await getExpectationCollection(projectId, path);
      const groupCollection = await getGroupCollection(projectId, path);
      const expectations = sortExpectationsByMatchOrder(
        collection.find({}),
        groupCollection.find({})
      );
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

function expectationKey(expectation: ExpectationM): string {
  const methodMatcher = expectation.matchers.find(
    (matcher) => matcher.type === RequestMatcherType.METHOD
  );
  const pathMatcher = expectation.matchers.find(
    (matcher) => matcher.type === RequestMatcherType.PATH
  );
  const method = methodMatcher ? methodMatcher.value.toUpperCase() : "";
  const pathValue = pathMatcher ? pathMatcher.value : "";
  return `${method}::${pathValue}`;
}

function errorMessage(error: any): string {
  if (error instanceof Error && error.message) {
    return error.message;
  }
  return String(error);
}
