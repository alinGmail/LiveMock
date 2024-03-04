import {LogViewM} from "../logView";
import {LogM} from "../log";
import {EmptyResponse} from "./common";


export interface ListLogResponse{

}

/**
 * list logs by logView
 */

export type ListLogViewLogsResponse = Array<LogM>;


export type ListLogViewResponse = Array<LogViewM>



export type DeleteAllRequestLogsResponse = EmptyResponse;