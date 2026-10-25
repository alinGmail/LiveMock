import { Collection } from "lokijs";
import { ExpectationM } from "livemock-core/struct/expectation";
import {
  getExpectationDb,
  getLogCollection,
  getLogDb,
  getLogViewCollection,
  getLogViewDb,
} from "../db/dbManager";
import express, { NextFunction, Request, Response } from "express";
import bodyParser from "body-parser";
import { ServerError, toAsyncRouter } from "./common";
import {
  DeleteAllRequestLogsPathParam,
  DeleteAllRequestLogsReqBody,
  DeleteAllRequestLogsReqQuery,
  GetLogDetailPathParam,
  GetLogDetailReqBody,
  GetLogDetailReqQuery,
  GetLogDetailResponse,
  ListLogPathParam,
  ListLogReqBody,
  ListLogReqQuery,
  ListLogViewLogsPathParam,
  ListLogViewLogsReqBody,
  ListLogViewLogsReqQuery,
  ListLogViewPathParam,
  ListLogViewReqBody,
  ListLogViewReqQuery,
  QueryLogsByFiltersPathParam,
  QueryLogsByFiltersReqBody,
  QueryLogsByFiltersReqQuery,
  QueryLogsReqQuery,
} from "livemock-core/struct/params/LogParams";
import {
  FilterType,
  LogFilterCondition,
  LogFilterM,
  LogM,
  PresetFilterName,
} from "livemock-core/struct/log";
import { Server, Socket } from "socket.io";
import {
  DeleteAllRequestLogsResponse,
  ListLogViewLogsResponse,
  ListLogViewResponse,
  QueryLogsResponse,
} from "livemock-core/struct/response/LogResponse";
import { logEventEmitter, logViewEventEmitter } from "../common/eventEmitters";
import { changeToLokijsFilter, getLogDynamicView } from "../log/logUtils";
import console from "console";

const PAGE_SIZE = 100;
const QUERY_PAGE_SIZE = 100;

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

// Keep the ad-hoc filter helpers in sync with the desktop handler at
// desktop/electron/handler/logViewHandler.ts.
const MAX_QUERY_FILTERS = 50;
const DEFAULT_QUERY_FILTER_ID = "log-query";
const LOG_FILTER_CONDITIONS = new Set<string>(
  Object.values(LogFilterCondition)
);

function filterProperty(value: unknown, index: number): string {
  if (typeof value !== "string" || value.trim() === "") {
    throw new ServerError(
      400,
      `filters[${index}].property must be a non-empty string`
    );
  }
  const property = value.trim();
  if (property.startsWith("$")) {
    throw new ServerError(
      400,
      `filters[${index}].property must not start with $`
    );
  }
  if (property.length > 200) {
    throw new ServerError(400, `filters[${index}].property is too long`);
  }
  return property;
}

function filterValue(
  value: unknown,
  index: number
): string | number | Array<string | number> {
  if (typeof value === "string" || typeof value === "number") {
    return value;
  }
  if (
    Array.isArray(value) &&
    value.every(
      (item) => typeof item === "string" || typeof item === "number"
    )
  ) {
    return value;
  }
  throw new ServerError(
    400,
    `filters[${index}].value must be a string, a number or an array of those`
  );
}

const TIME_PROPERTIES = new Set(["req.requestTime", "res.responseTime"]);

/** Time fields are numeric in the log; accept ISO-8601 strings as a courtesy. */
function normalizeFilterValue(
  property: string,
  value: string | number | Array<string | number>
): string | number | Array<string | number> {
  if (!TIME_PROPERTIES.has(property)) {
    return value;
  }
  const convert = (item: string | number): string | number => {
    if (typeof item === "string" && !/^-?\d+$/.test(item.trim())) {
      const parsed = Date.parse(item);
      if (Number.isFinite(parsed)) {
        return parsed;
      }
    }
    return item;
  };
  return Array.isArray(value) ? value.map(convert) : convert(value);
}

/**
 * Translate view-shaped filters into a Loki query without touching the saved
 * log view. Active filters are ANDed, matching the dynamic-view pipeline.
 */
function buildFilterQuery(
  filters: unknown,
  maxLogId: number | undefined
): Record<string, unknown> {
  if (!Array.isArray(filters)) {
    throw new ServerError(400, "filters must be an array");
  }
  if (filters.length > MAX_QUERY_FILTERS) {
    throw new ServerError(
      400,
      `filters must contain at most ${MAX_QUERY_FILTERS} entries`
    );
  }

  const clauses: Array<Record<string, unknown>> = [];
  if (maxLogId !== undefined) {
    clauses.push({ id: { $lt: maxLogId } });
  }

  filters.forEach((filter, index) => {
    if (!filter || typeof filter !== "object" || Array.isArray(filter)) {
      throw new ServerError(400, `filters[${index}] must be an object`);
    }
    const raw = filter as Record<string, unknown>;
    if (raw.type === FilterType.GROUP_FILTER) {
      throw new ServerError(
        400,
        `filters[${index}]: GROUP_FILTER is not supported by log queries`
      );
    }
    if (
      raw.type !== undefined &&
      raw.type !== FilterType.SIMPLE_FILTER &&
      raw.type !== FilterType.PRESET_FILTER
    ) {
      throw new ServerError(
        400,
        `filters[${index}].type must be SIMPLE_FILTER or PRESET_FILTER`
      );
    }
    if (raw.activate !== undefined && typeof raw.activate !== "boolean") {
      throw new ServerError(
        400,
        `filters[${index}].activate must be a boolean`
      );
    }
    if (
      typeof raw.condition !== "string" ||
      !LOG_FILTER_CONDITIONS.has(raw.condition)
    ) {
      throw new ServerError(
        400,
        `filters[${index}].condition is not supported`
      );
    }
    const property = filterProperty(raw.property, index);
    const value = normalizeFilterValue(
      property,
      filterValue(raw.value, index)
    );
    if (raw.activate === false) {
      return;
    }

    const normalized = {
      ...raw,
      type: raw.type ?? FilterType.SIMPLE_FILTER,
      id: typeof raw.id === "string" ? raw.id : DEFAULT_QUERY_FILTER_ID,
      property,
      condition: raw.condition,
      value,
      activate: true,
    } as unknown as LogFilterM;
    const clause = changeToLokijsFilter(normalized);
    if (!clause) {
      throw new ServerError(
        400,
        `filters[${index}] could not be translated`
      );
    }
    clauses.push(clause as Record<string, unknown>);
  });

  return clauses.length > 0 ? { $and: clauses } : {};
}

function withoutBodies(log: LogM): LogM {
  return {
    ...log,
    req: log.req ? { ...log.req, body: null, rawBody: null } : log.req,
    res: log.res ? { ...log.res, body: null, rawBody: null } : log.res,
  };
}

function queryIncludeBody(value: unknown): boolean {
  return (
    value === true || String(value) === "true" || String(value) === "1"
  );
}

function jsonBodyParser() {
  const parse = bodyParser.json();
  return (req: Request, res: Response, next: NextFunction) => {
    parse(req, res, (error) => {
      if (error) {
        next(new ServerError(400, "invalid JSON body"));
        return;
      }
      next();
    });
  };
}

function runLogQuery(
  collection: Collection<LogM>,
  filter: Record<string, unknown>,
  limit: number,
  includeBody: boolean
): QueryLogsResponse {
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

export async function getLogRouter(path: string): Promise<express.Router> {
  let router = toAsyncRouter(express());

  /**
   * list the log
   */
  router.get(
    "/",
    async (
      req: Request<
        ListLogPathParam,
        Array<LogM>,
        ListLogReqBody,
        ListLogReqQuery
      >,
      res: Response<Array<LogM>>
    ) => {
      const projectId = req.query.projectId;
      if (!projectId) {
        throw new ServerError(400, "project id not exist!");
      }
      const collection = await getLogCollection(projectId, path);
      const chain = collection.chain();
      const maxLogId = req.query.maxLogId;
      if (maxLogId === undefined || maxLogId === null) {
      } else {
        chain.find({ id: { $lt: maxLogId } });
      }
      const logs = chain
        .find({})
        .simplesort("id", { desc: true })
        .limit(PAGE_SIZE)
        .data();
      res.json(logs);
    }
  );

  /**
   * query the logs with ad-hoc, read-only filters
   */
  router.get(
    "/query",
    async (
      req: Request<
        Record<string, never>,
        QueryLogsResponse,
        Record<string, never>,
        QueryLogsReqQuery
      >,
      res: Response<QueryLogsResponse>
    ) => {
      const projectId = req.query.projectId;
      if (!projectId) {
        throw new ServerError(400, "project id not exist!");
      }
      const maxLogId = queryMaxLogId(req.query.maxLogId);
      const limit = queryLimit(req.query.limit);
      const includeBody = queryIncludeBody(req.query.includeBody);
      const filter = logQueryFilter(req.query, maxLogId);

      const collection = await getLogCollection(projectId, path);
      res.json(runLogQuery(collection, filter, limit, includeBody));
    }
  );

  /**
   * query the logs with view-shaped, read-only filters
   */
  router.post(
    "/queryByFilters",
    jsonBodyParser(),
    async (
      req: Request<
        QueryLogsByFiltersPathParam,
        QueryLogsResponse,
        QueryLogsByFiltersReqBody,
        QueryLogsByFiltersReqQuery
      >,
      res: Response<QueryLogsResponse>
    ) => {
      const body = req.body ?? ({} as QueryLogsByFiltersReqBody);
      if (!body.projectId) {
        throw new ServerError(400, "project id not exist!");
      }
      const maxLogId = queryMaxLogId(body.maxLogId);
      const limit = queryLimit(body.limit);
      const includeBody = queryIncludeBody(body.includeBody);
      const filter = buildFilterQuery(body.filters, maxLogId);

      const collection = await getLogCollection(body.projectId, path);
      res.json(runLogQuery(collection, filter, limit, includeBody));
    }
  );

  /**
   * list the log view
   */
  router.get(
    "/logView",
    async (
      req: Request<
        ListLogViewPathParam,
        ListLogViewResponse,
        ListLogViewReqBody,
        ListLogViewReqQuery
      >,
      res: Response<ListLogViewResponse>
    ) => {
      const projectId = req.query.projectId;
      if (!projectId) {
        throw new ServerError(400, "project id not exist!");
      }

      const logViewCollection = await getLogViewCollection(projectId, path);
      const logViews = logViewCollection.find({});
      res.json(logViews);
    }
  );

  /**
   * get log item
   */
  router.get(
      `/detail/:logId`,
      async (
          req: Request<
              GetLogDetailPathParam,
              GetLogDetailResponse,
              GetLogDetailReqBody,
              GetLogDetailReqQuery
          >,
          res: Response<GetLogDetailResponse>
      ) => {
        const logId = parseInt(req.params.logId);
        if (!logId) {
          throw new ServerError(400, "log id not exist!");
        }
        const projectId = req.query.projectId;
        const collection = await getLogCollection(projectId, path);

        const logItem = collection.findOne({ id: logId });
        if (logItem === null) {
          throw new ServerError(500, "log item not found!");
        }
        res.json({
          logItem,
        });
      }
  );

  /**
   * get the log view logs
   */
  router.get(
    "/logViewLogs/:logViewId",
    async (
      req: Request<
        ListLogViewLogsPathParam,
        ListLogViewLogsResponse,
        ListLogViewLogsReqBody,
        ListLogViewLogsReqQuery
      >,
      res: Response<ListLogViewLogsResponse>
    ) => {
      let { maxLogId, projectId, limit } = req.query;
      const lovViewId = req.params.logViewId;
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
      let resultset = dynamicView.branchResultset(); //.limit(PAGE_SIZE).data();
      if (maxLogId === undefined || maxLogId === null || maxLogId === "") {
      } else {
        resultset = resultset.find({ id: { $lt: maxLogId } });
      }
      const logs = resultset
        .simplesort("id", { desc: true })
        .limit(pageSize)
        .data();
      res.json(logs);
    }
  );

  router.delete(
    "/",
    async (
      req: Request<
        DeleteAllRequestLogsPathParam,
        DeleteAllRequestLogsResponse,
        DeleteAllRequestLogsReqBody,
        DeleteAllRequestLogsReqQuery
      >,
      res: Response<DeleteAllRequestLogsResponse>
    ) => {
      let { projectId } = req.query;
      if (!projectId) {
        throw new ServerError(400, "project id not exist!");
      }
      const logCollection = await getLogCollection(projectId, path);
      logCollection.findAndRemove({});
      res.json({ message: "success" });
    }
  );

  return router;
}

export async function addLogListener(io: Server, path: string) {
  io.on("connection", async (socket) => {
    const { projectId } = socket.handshake.query;
    const logDb = await getLogDb(projectId as string, path);
    const logCollection = await getLogCollection(projectId as string, path);
    const logViewMCollection = await getLogViewCollection(
      projectId as string,
      path
    );
    const logView = logViewMCollection.findOne({});
    if (!logView) {
      console.error("log view is null,projectId:" + projectId);
      return;
    }
    socket.join(`logView:${logView.id}`);
    const chain = logCollection.chain();
    const logs = chain
      .find({})
      .simplesort("id", { desc: true })
      .limit(PAGE_SIZE)
      .data();
    socket.on("initLogsReq", (args) => {
      socket.emit("initLogsRes", logs);
    });

    socket.on("join_log_update", (logId: number) => {
      socket.join(`log:${projectId}:${logId}`);
    });
    socket.on("leave_log_update", (logId: number) => {
      socket.leave(`log:${projectId}:${logId}`);
    });

    socket.on("disconnect", () => {
      socket.leave(`logView:${logView.id}`);
    });
  });

  logViewEventEmitter.on("insert", (arg: { log: LogM; logViewId: string }) => {
    let { log, logViewId } = arg;
    io.to(`logView:${logViewId}`).emit("insert", { log, logViewId });
  });

  logViewEventEmitter.on("update", (arg: { log: LogM; logViewId: string }) => {
    let { log, logViewId } = arg;
    io.to(`logView:${logViewId}`).emit("update", { log, logViewId });
  });

  logViewEventEmitter.on("delete", (arg: { id: number; logViewId: string }) => {
    let { id, logViewId } = arg;
    io.to(`logView:${logViewId}`).emit("delete", { id, logViewId });
  });

  logViewEventEmitter.on(
    "updateExpectation",
    (arg: { projectId: string; expectation: ExpectationM }) => {
      let { projectId, expectation } = arg;
      io.emit("updateExpectation", { projectId, expectation });
    }
  );

  logEventEmitter.on(
    "update",
    (args: { projectId: string; log: LogM; oldLog: LogM }) => {
      let { projectId, log, oldLog } = args;
      io.to(`log:${projectId}:${log.id}`).emit("updateLog", { log, projectId });
    }
  );
}
