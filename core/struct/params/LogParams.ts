import { LogM } from "../log";

/**
 * list log
 */
export interface ListLogPathParam {}

export interface ListLogReqBody {}

export interface ListLogReqQuery {
  maxLogId?: number;
  projectId: string;
}

export interface QueryLogsPathParam {}

export interface QueryLogsReqBody {}

/**
 * query logs
 *
 * Ad-hoc, read-only filtering over a project's request logs. Unlike a log
 * view, these conditions are not persisted and do not change what the web UI
 * sees. Values are ANDed across fields; repeated values of one field are ORed.
 */
export interface QueryLogsReqQuery {
  projectId: string;
  /** Return entries older than this log id. */
  maxLogId?: string | number | null;
  /** Page size, capped at 100. Defaults to 100. */
  limit?: string | number | null;
  /** HTTP method(s), case-insensitive. */
  method?: string | Array<string>;
  /** Exact URL path(s), query string excluded. */
  path?: string | Array<string>;
  /** URL path substring(s), case-sensitive. */
  pathContains?: string | Array<string>;
  /** Exact status code(s) or family tokens such as "2xx". */
  status?: string | number | Array<string | number>;
  expectationId?: string | Array<string>;
  /** Request time lower bound, inclusive, as epoch milliseconds or ISO-8601. */
  since?: string | number;
  /** Request time upper bound, exclusive, as epoch milliseconds or ISO-8601. */
  until?: string | number;
  /** Include request and response bodies. Defaults to false. */
  includeBody?: string | boolean;
}

/**
 * get log detail
 */
export interface GetLogDetailPathParam {
  logId: string;
}

export interface GetLogDetailReqBody {
}

export interface GetLogDetailReqQuery {
  projectId: string;
}

export interface GetLogDetailResponse {
  logItem: LogM;
}

/**
 * list log view
 */

export interface ListLogViewPathParam {}

export interface ListLogViewReqBody {}

export interface ListLogViewReqQuery {
  projectId: string;
}

/**
 * list logs by logView
 */

export interface ListLogViewLogsPathParam {
  logViewId: string;
}

export interface ListLogViewLogsReqBody {}

export interface ListLogViewLogsReqQuery {
  projectId: string;
  maxLogId: string | number | null;
  /** Page size; defaults to and is capped by the server's page size. */
  limit?: number;
}

/**
 * delete all logs by logView
 */
export interface DeleteAllRequestLogsPathParam {}

export interface DeleteAllRequestLogsReqBody {}

export interface DeleteAllRequestLogsReqQuery {
  projectId: string;
}
