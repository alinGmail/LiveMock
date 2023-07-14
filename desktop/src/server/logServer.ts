import {
  ListLogViewLogsReqQuery,
  ListLogViewReqQuery,
} from "core/struct/params/LogParams";
import {
  ListLogViewLogsResponse,
  ListLogViewResponse,
} from "core/struct/response/LogResponse";

export async function listLogViewReq(
  query: ListLogViewReqQuery
): Promise<ListLogViewResponse> {
  return window.api.logView.listLogView({}, query, {});
}

export async function listLogViewLogs(
  logViewId: string,
  query: ListLogViewLogsReqQuery
): Promise<ListLogViewLogsResponse> {
  return window.api.logView.listLogViewLogs({logViewId},query,{});
}
