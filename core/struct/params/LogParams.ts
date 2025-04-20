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

/**
 * get log detail
 */
export interface GetLogDetailPathParam {
  logId: string;
}

export interface GetLogDetailReqBody {
  projectId: string;
}

export interface GetLogDetailReqQuery {}

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
  maxLogId: string | null;
}

/**
 * delete all logs by logView
 */
export interface DeleteAllRequestLogsPathParam {}

export interface DeleteAllRequestLogsReqBody {}

export interface DeleteAllRequestLogsReqQuery {
  projectId: string;
}
