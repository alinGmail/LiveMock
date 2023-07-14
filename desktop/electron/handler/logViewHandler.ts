import ipcMain = electron.ipcMain;
import * as electron from "electron";
import { LogViewEvents } from "core/struct/events/desktopEvents";
import {
  ListLogViewLogsPathParam,
  ListLogViewLogsReqBody,
  ListLogViewLogsReqQuery,
  ListLogViewPathParam,
  ListLogViewReqBody,
  ListLogViewReqQuery,
} from "core/struct/params/LogParams";
import { ServerError } from "./common";
import { getLogCollection, getLogViewCollection } from "../db/dbManager";
import { getLogDynamicView } from "../log/logUtils";

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
}
