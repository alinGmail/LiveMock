import * as electron from "electron";
import ipcMain = electron.ipcMain;
import {
  LogEvents,
  LogViewEvents,
} from "livemock-core/struct/events/desktopEvents";
import {
  DeleteAllRequestLogsPathParam,
  DeleteAllRequestLogsReqBody,
  DeleteAllRequestLogsReqQuery,
  GetLogDetailPathParam,
  GetLogDetailReqBody,
  GetLogDetailReqQuery,
  ListLogViewLogsPathParam,
  ListLogViewLogsReqBody,
  ListLogViewLogsReqQuery,
  ListLogViewPathParam,
  ListLogViewReqBody,
  ListLogViewReqQuery,
  QueryLogsPathParam,
  QueryLogsReqBody,
  QueryLogsReqQuery,
} from "livemock-core/struct/params/LogParams";
import { ServerError } from "./common";
import { getLogCollection, getLogViewCollection } from "../db/dbManager";
import { changeToLokijsFilter, getLogDynamicView } from "../log/logUtils";
import {
  FilterType,
  LogFilterCondition,
  LogM,
  PresetFilterName,
} from "livemock-core/struct/log";
import { QueryLogsResponse } from "livemock-core/struct/response/LogResponse";
import WebContents = electron.WebContents;
import { logEventEmitter, logViewEventEmitter } from "../common/eventEmitters";

const PAGE_SIZE = 100;
const QUERY_PAGE_SIZE = 100;

// Keep the ad-hoc query helpers in sync with the web controller at
// backEnd/src/controller/logController.ts.
/** Normalize a repeatable query value into the non-empty strings it holds. */
function queryValues(value: unknown): Array<string> {
  const raw = Array.isArray(value) ? value : [value];
  const values: Array<string> = [];
  raw.forEach((item) => {
    if (typeof item === "string" || typeof item === "number") {
      const normalized = String(item).trim();
      if (normalized !== "") {
        values.push(normalized);
      }
    }
  });
  return values;
}

/** Read a query value that may only appear once. */
function singleQueryValue(value: unknown, name: string): string | undefined {
  if (value === undefined || value === null) {
    return undefined;
  }
  if (Array.isArray(value)) {
    throw new ServerError(400, `${name} accepts a single value`);
  }
  if (typeof value !== "string" && typeof value !== "number") {
    throw new ServerError(400, `${name} accepts a single value`);
  }
  const normalized = String(value).trim();
  return normalized === "" ? undefined : normalized;
}

function queryLimit(value: unknown): number {
  const raw = singleQueryValue(value, "limit");
  if (raw === undefined) {
    return QUERY_PAGE_SIZE;
  }
  const limit = Number(raw);
  if (!Number.isInteger(limit) || limit < 1) {
    throw new ServerError(400, "limit must be a positive integer");
  }
  return Math.min(limit, QUERY_PAGE_SIZE);
}

function queryMaxLogId(value: unknown): number | undefined {
  const raw = singleQueryValue(value, "maxLogId");
  if (raw === undefined) {
    return undefined;
  }
  const maxLogId = Number(raw);
  if (!Number.isInteger(maxLogId)) {
    throw new ServerError(400, "maxLogId must be an integer");
  }
  return maxLogId;
}

/** Accept epoch milliseconds or an ISO-8601 timestamp. */
function queryTime(value: unknown, name: string): number | undefined {
  const raw = singleQueryValue(value, name);
  if (raw === undefined) {
    return undefined;
  }
  if (/^-?\d+$/.test(raw)) {
    const epoch = Number(raw);
    if (Number.isSafeInteger(epoch)) {
      return epoch;
    }
  }
  const parsed = Date.parse(raw);
  if (!Number.isFinite(parsed)) {
    throw new ServerError(
      400,
      `${name} must be epoch milliseconds or an ISO-8601 timestamp`
    );
  }
  return parsed;
}

/** Accept exact status codes and family tokens such as "2xx". */
function queryStatuses(value: unknown): Array<string> {
  return queryValues(value).map((token) => {
    if (/^[1-5]xx$/i.test(token)) {
      return token;
    }
    if (/^\d+$/.test(token)) {
      const status = Number(token);
      if (status >= 0 && status <= 999) {
        return token;
      }
    }
    throw new ServerError(
      400,
      `invalid status "${token}": use an HTTP status code or a family such as 2xx`
    );
  });
}

/**
 * Build an ad-hoc filter over the raw log collection. Saved log view filters
 * are deliberately ignored: a query must be reproducible from its parameters.
 */
function logQueryFilter(
  query: QueryLogsReqQuery,
  maxLogId: number | undefined
): Record<string, unknown> {
  const clauses: Array<Record<string, unknown>> = [];
  if (maxLogId !== undefined) {
    clauses.push({ id: { $lt: maxLogId } });
  }

  const methods = queryValues(query.method).map((method) =>
    method.toUpperCase()
  );
  if (methods.length > 0) {
    clauses.push({ "req.method": { $in: methods } });
  }

  const paths = queryValues(query.path);
  if (paths.length > 0) {
    clauses.push({ "req.path": { $in: paths } });
  }

  const pathContains = queryValues(query.pathContains);
  if (pathContains.length > 0) {
    clauses.push({
      $or: pathContains.map((value) => ({
        "req.path": { $contains: value },
      })),
    });
  }

  const statuses = queryStatuses(query.status);
  if (statuses.length > 0) {
    clauses.push(
      changeToLokijsFilter({
        type: FilterType.PRESET_FILTER,
        name: PresetFilterName.STATUS_CODE,
        id: "log-query-status",
        property: "res.status",
        value: statuses,
        condition: LogFilterCondition.FAMILY,
        activate: true,
      }) as Record<string, unknown>
    );
  }

  const expectationIds = queryValues(query.expectationId);
  if (expectationIds.length > 0) {
    clauses.push({ expectationId: { $in: expectationIds } });
  }

  const since = queryTime(query.since, "since");
  if (since !== undefined) {
    clauses.push({ "req.requestTime": { $gte: since } });
  }
  const until = queryTime(query.until, "until");
  if (until !== undefined) {
    clauses.push({ "req.requestTime": { $lt: until } });
  }

  return clauses.length > 0 ? { $and: clauses } : {};
}

function withoutBodies(log: LogM): LogM {
  return {
    ...log,
    req: log.req ? { ...log.req, body: null, rawBody: null } : log.req,
    res: log.res ? { ...log.res, body: null, rawBody: null } : log.res,
  };
}

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
      const { maxLogId, projectId, limit } = reqQuery;
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
      const pageSize =
        Number(limit) > 0 ? Math.min(Number(limit), PAGE_SIZE) : PAGE_SIZE;
      let resultset = dynamicView.branchResultset();
      if (maxLogId === undefined || maxLogId === null || maxLogId === "") {
      } else {
        resultset = resultset.find({ id: { $lt: maxLogId } });
      }
      const logs = resultset
        .simplesort("id", { desc: true })
        .limit(pageSize)
        .data();
      return logs;
    }
  );

  ipcMain.handle(
    LogViewEvents.QueryLogs,
    async (
      event,
      reqParam: QueryLogsPathParam,
      reqQuery: QueryLogsReqQuery,
      reqBody: QueryLogsReqBody
    ): Promise<QueryLogsResponse> => {
      const projectId = reqQuery.projectId;
      if (!projectId) {
        throw new ServerError(400, "project id not exist!");
      }
      const maxLogId = queryMaxLogId(reqQuery.maxLogId);
      const limit = queryLimit(reqQuery.limit);
      const includeBody =
        String(reqQuery.includeBody) === "true" ||
        String(reqQuery.includeBody) === "1";
      const filter = logQueryFilter(reqQuery, maxLogId);

      const collection = await getLogCollection(projectId, path);
      const results = collection
        .chain()
        .find(filter)
        .simplesort("id", { desc: true })
        .limit(limit + 1)
        .data();
      const hasMore = results.length > limit;
      const logs = results
        .slice(0, limit)
        .map((log) => (includeBody ? log : withoutBodies(log)));
      return { logs, hasMore };
    }
  );

  ipcMain.handle(
    LogViewEvents.GetLogDetail,
    async (
      event,
      reqParam: GetLogDetailPathParam,
      reqQuery: GetLogDetailReqQuery,
      reqBody: GetLogDetailReqBody
    ) => {
      const logId = parseInt(reqParam.logId);
      if (!logId) {
        throw new ServerError(400, "log id not exist!");
      }
      const projectId = reqQuery.projectId;
      const collection = await getLogCollection(projectId, path);

      const logItem = collection.findOne({ id: logId });
      if (logItem === null) {
        throw new ServerError(500, "log item not found!");
      }
      return { logItem };
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
    const { log, logViewId } = arg;
    webContent.send(LogViewEvents.OnLogAdd, { log, logViewId });
  });

  logViewEventEmitter.on("update", (arg: { log: LogM; logViewId: string }) => {
    const { log, logViewId } = arg;
    webContent.send(LogViewEvents.OnLogUpdate, { log, logViewId });
  });

  logViewEventEmitter.on("delete", (arg: { id: number; logViewId: string }) => {
    const { id, logViewId } = arg;
    webContent.send(LogViewEvents.OnLogDelete, { id, logViewId });
  });

  logEventEmitter.on(
    "update",
    (arg: { projectId: string; log: LogM; oldLog: LogM }) => {
      const { oldLog, log, projectId } = arg;
      webContent.send(LogEvents.OnLogUpdate, { log, projectId });
    }
  );
}
