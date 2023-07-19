import {
  ListLogViewLogsReqQuery,
  ListLogViewReqQuery,
} from "core/struct/params/LogParams";
import * as superagent from "superagent";
import { ServerUrl } from "../config";
import {
  ListLogViewLogsResponse,
  ListLogViewResponse,
} from "core/struct/response/LogResponse";

export async function listLogViewReq(
  query: ListLogViewReqQuery
): Promise<ListLogViewResponse> {
  const response = await superagent
    .get(`${ServerUrl}/log/logView`)
    .query(query);
  return response.body;
}

export async function listLogViewLogs(
  logViewId: string,
  query: ListLogViewLogsReqQuery
): Promise<ListLogViewLogsResponse> {
  const response = await superagent
    .get(`${ServerUrl}/log/logViewLogs/${logViewId}`)
    .query(query);
  return response.body;
}
