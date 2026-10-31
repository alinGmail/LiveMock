import {LogViewM} from "../logView";
import {LogM} from "../log";
import {EmptyResponse} from "./common";


export interface ListLogResponse{

}

/**
 * query logs
 */
export interface QueryLogsResponse {
  logs: Array<LogM>;
  /** True when older matching logs remain beyond this page. */
  hasMore: boolean;
}

/**
 * list logs by logView
 */

export type ListLogViewLogsResponse = Array<LogM>;


export type ListLogViewResponse = Array<LogViewM>



export type DeleteAllRequestLogsResponse = EmptyResponse;