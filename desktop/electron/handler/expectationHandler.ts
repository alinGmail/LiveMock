import * as electron from "electron";
import { ExpectationEvents } from "livemock-core/struct/events/desktopEvents";
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
import { ServerError } from "./common";
import { getExpectationCollection } from "../db/dbManager";
import {logViewEventEmitter} from "../common/eventEmitters";
import { ExpectationM } from "livemock-core/struct/expectation";
import { RequestMatcherType } from "livemock-core/struct/matcher";
import {
  BatchImportReqBody,
  BatchImportResult,
  parseImportContent,
} from "livemock-core/import/index";

const ipcMain = electron.ipcMain;

export async function setExpectationHandler(path: string): Promise<void> {
  ipcMain.handle(
    ExpectationEvents.CreateExpectation,
    async (
      event,
      reqParam: CreateExpectationPathParam,
      reqQuery: CreateExpectationReqQuery,
      reqBody: CreateExpectationReqBody
    ) => {
      let { expectation, projectId } = reqBody;
      if (!projectId) {
        throw new ServerError(400, "project id not exist!");
      }
      const collection = await getExpectationCollection(projectId, path);
      if (expectation) {
        const resExp = collection.insert(expectation);
        logViewEventEmitter.emit("insertExpectation", { projectId, resExp });
        return resExp;
      } else {
        throw new ServerError(400, "expectation not exist!");
      }
    }
  );

  ipcMain.handle(
    ExpectationEvents.ListExpectation,
    async (
      event,
      reqParam: ListExpectationPathParam,
      reqQuery: ListExpectationReqQuery,
      reqBody: ListExpectationReqBody
    ) => {
      const projectId = reqQuery.projectId;
      if (!projectId) {
        throw new ServerError(400, "project id not exist!");
      }
      const collection = await getExpectationCollection(projectId, path);
      const expectations = collection.find({}).reverse();
      return expectations;
    }
  );

  ipcMain.handle(
    ExpectationEvents.DeleteExpectation,
    async (
      event,
      reqParam: DeleteExpectationPathParam,
      reqQuery: DeleteExpectationReqQuery,
      reqBody: DeleteExpectationReqBody
    ) => {
      const expectationId = reqParam.expectationId;
      const projectId = reqQuery.projectId;

      if (!projectId) {
        throw new ServerError(400, "project id not exist!");
      }
      const collection = await getExpectationCollection(projectId, path);
      const expectation = collection.findOne({ id: expectationId });
      if (!expectation) {
        throw new ServerError(500, "expectation not exist");
      }
      collection.remove(expectation);
      logViewEventEmitter.emit('deleteExpectation', { projectId, expectation });
      return { message: "success" };
    }
  );

  ipcMain.handle(
    ExpectationEvents.UpdateExpectation,
    async (
      event,
      reqParam: UpdateExpectationPathParam,
      reqQuery: UpdateExpectationReqQuery,
      reqBody: UpdateExpectationReqBody
    ) => {
      const projectId = reqBody.projectId;
      if (!projectId) {
        throw new ServerError(400, "project id not exist!");
      }
      const collection = await getExpectationCollection(projectId, path);
      const expectationId = reqParam.expectationId;
      const expectation = collection.findOne({ id: expectationId });
      if (!expectation) {
        throw new ServerError(500, "expectation not exist");
      }
      Object.assign(expectation, reqBody.expectationUpdate);
      const result = collection.update(expectation);
      logViewEventEmitter.emit("updateExpectation", { projectId, expectation });
      return result;
    }
  );

  ipcMain.handle(
    ExpectationEvents.GetExpectation,
    async (
      event,
      reqParam: GetExpectationPathParam,
      reqQuery: GetExpectationReqQuery,
      reqBody: GetExpectationReqBody
    ) => {
      const projectId = reqQuery.projectId;
      if (!projectId) {
        throw new ServerError(400, "project id not exist!");
      }
      const expectationId = reqParam.expectationId;
      const collection = await getExpectationCollection(projectId, path);
      const expectation = collection.findOne({ id: expectationId });
      if (!expectation) {
        throw new ServerError(500, "expectation not exist");
      }
      return expectation;
    }
  );

  ipcMain.handle(
    ExpectationEvents.BatchImportExpectation,
    async (
      event,
      reqParam: {},
      reqQuery: {},
      reqBody: BatchImportReqBody
    ): Promise<BatchImportResult> => {
      const projectId = reqBody && reqBody.projectId;
      if (!projectId) {
        throw new ServerError(400, "project id not exist!");
      }
      if (!reqBody.content || typeof reqBody.content !== "string") {
        throw new ServerError(400, "file content not exist!");
      }
      const options = reqBody.options || {};
      let parsed;
      try {
        parsed = await parseImportContent(reqBody.content, {
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
      return {
        format: parsed.format,
        created,
        overwritten,
        skipped,
        failures: parsed.failures,
      };
    }
  );
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
