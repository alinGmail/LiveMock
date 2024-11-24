import * as electron from "electron";
import ipcMain = electron.ipcMain;
import { LogEvents, LogViewEvents } from "livemock-core/struct/events/desktopEvents";
import {
  DeleteAllRequestLogsPathParam,
  DeleteAllRequestLogsReqBody,
  DeleteAllRequestLogsReqQuery,
  ListLogViewLogsPathParam,
  ListLogViewLogsReqBody,
  ListLogViewLogsReqQuery,
  ListLogViewPathParam,
  ListLogViewReqBody,
  ListLogViewReqQuery,
} from "livemock-core/struct/params/LogParams";
import { ServerError } from "./common";
import { getLogCollection, getLogViewCollection } from "../db/dbManager";
import { getLogDynamicView } from "../log/logUtils";
import { LogM } from "livemock-core/struct/log";
import WebContents = electron.WebContents;
import { logEventEmitter, logViewEventEmitter } from "../common/eventEmitters";

const PAGE_SIZE = 100;
export async function setLogViewHandler(path: string) {
  ipcMain.handle(
    LogViewEvents.ListLogView,
    async (
      event,
      reqParam: ListLogViewPathParam,
      reqQuery: ListLogViewReqQuery,
      reqBody: ListLogViewReqBody
    ) => {
      const projectId = reqQuery.projectId;
      if (!projectId) {
        throw new ServerError(400, "project id not exist!");
      }

      const logViewCollection = await getLogViewCollection(projectId, path);
      const logViews = logViewCollection.find({});
      return logViews;
    }
  );

  ipcMain.handle(
    LogViewEvents.ListLogViewLogs,
    async (
      event,
      reqParam: ListLogViewLogsPathParam,
      reqQuery: ListLogViewLogsReqQuery,
      reqBody: ListLogViewLogsReqBody
    ) => {
      let { maxLogId, projectId } = reqQuery;
      const lovViewId = reqParam.logViewId;
      if (!projectId) {
        throw new ServerError(400, "project id not exist!");
      }
      const logViewCollection = await getLogViewCollection(projectId, path);
      const logView = logViewCollection.findOne({ id: lovViewId });
      if (!logView) {
        throw new ServerError(500, "logView did not exist!");
      }
      const logCollection = await getLogCollection(projectId, path);
      const dynamicView = await getLogDynamicView(projectId, logView.id, path);
      let resultset = dynamicView.branchResultset();
      if (maxLogId === undefined || maxLogId === null || maxLogId === "") {
      } else {
        resultset = resultset.find({ id: { $lt: maxLogId } });
      }
      const logs = resultset
        .simplesort("id", { desc: true })
        .limit(PAGE_SIZE)
        .data();
      return logs;
    }
  );

  ipcMain.handle(
    LogViewEvents.DeleteAllRequestLogs,
    async (
      event,
      reqParam: DeleteAllRequestLogsPathParam,
      reqQuery: DeleteAllRequestLogsReqQuery,
      reqBody: DeleteAllRequestLogsReqBody
    ) => {
      const { projectId } = reqQuery;
      if (!projectId) {
        throw new ServerError(400, "project id not exist!");
      }
      const logCollection = await getLogCollection(projectId, path);
      logCollection.findAndRemove({});
      return { message: "success" };
    }
  );
}

let logViewEventHandlerInit = false;

export function logViewEventHandler(webContent: WebContents) {
  if (logViewEventHandlerInit) {
    return;
  }
  logViewEventHandlerInit = true;
  logViewEventEmitter.on("insert", (arg: { log: LogM; logViewId: string }) => {
    let { log, logViewId } = arg;
    webContent.send(LogViewEvents.OnLogAdd, { log, logViewId });
  });

  logViewEventEmitter.on("update", (arg: { log: LogM; logViewId: string }) => {
    let { log, logViewId } = arg;
    webContent.send(LogViewEvents.OnLogUpdate, { log, logViewId });
  });

  logViewEventEmitter.on("delete", (arg: { log: LogM; logViewId: string }) => {
    let { log, logViewId } = arg;
    webContent.send(LogViewEvents.OnLogDelete, { log, logViewId });
  });

  logEventEmitter.on(
    LogEvents.OnLogUpdate,
    (arg: { projectId: string; log: LogM; oldLog: LogM }) => {
      let { oldLog, log, projectId } = arg;
      webContent.send(LogEvents.OnLogUpdate, { log, projectId });
    }
  );
}
