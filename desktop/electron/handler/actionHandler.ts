import * as electron from "electron";
import { ActionEvents } from "livemock-core/struct/events/desktopEvents";
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
} from "livemock-core/struct/params/ActionParams";
import { ServerError } from "./common";
import { getExpectationCollection } from "../db/dbManager";
const ipcMain = electron.ipcMain;

export async function setActionHandler(path: string): Promise<void> {
  ipcMain.handle(
    ActionEvents.CreateAction,
    async (
      event,
      reqParam: CreateActionPathParam,
      reqQuery: CreateActionReqQuery,
      reqBody: CreateActionReqBody
    ) => {
      let { expectationId, action, projectId } = reqBody;
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
      return action;
    }
  );

  ipcMain.handle(
    ActionEvents.UpdateAction,
    async (
      event,
      reqParam: UpdateActionPathParam,
      reqQuery: UpdateActionReqQuery,
      reqBody: UpdateActionReqBody
    ) => {
      let { expectationId, actionUpdate, projectId } = reqBody;
      if (!projectId) {
        throw new ServerError(400, "project id not exist!");
      }
      const collection = await getExpectationCollection(projectId, path);
      const expectation = collection.findOne({ id: expectationId });
      if (!expectation) {
        throw new ServerError(500, "expectation not exist");
      }

      const actionIndex = expectation.actions.findIndex(
        (item) => item.id === reqParam.actionId
      );
      if (actionIndex === -1) {
        throw new ServerError(500, "action not exist");
      }
      Object.assign(expectation.actions[actionIndex], actionUpdate);
      collection.update(expectation);

      return expectation.actions[actionIndex];
    }
  );

  ipcMain.handle(
    ActionEvents.DeleteAction,
    async (
      event,
      reqParam: DeleteActionPathParam,
      reqQuery: DeleteActionReqQuery,
      reqBody: DeleteActionReqBody
    ) => {
      let { expectationId, projectId } = reqQuery;
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
        (item) => item.id !== reqParam.actionId
      );
      collection.update(expectation);
      return { message: "success" };
    }
  );
}
