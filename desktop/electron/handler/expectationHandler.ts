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
}
