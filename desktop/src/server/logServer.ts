import {
  DeleteAllRequestLogsReqQuery,
  ListLogViewLogsReqQuery,
  ListLogViewReqQuery,
} from "livemock-core/struct/params/LogParams";
import {
  DeleteAllRequestLogsResponse,
  ListLogViewLogsResponse,
  ListLogViewResponse,
} from "livemock-core/struct/response/LogResponse";

export async function listLogViewReq(
  query: ListLogViewReqQuery
): Promise<ListLogViewResponse> {
  return window.api.logView.listLogView({}, query, {});
}

export async function listLogViewLogs(
  logViewId: string,
  query: ListLogViewLogsReqQuery
): Promise<ListLogViewLogsResponse> {
  return window.api.logView.listLogViewLogs({ logViewId }, query, {});
}

export async function deleteAllRequestLogs(
  query: DeleteAllRequestLogsReqQuery
): Promise<DeleteAllRequestLogsResponse> {
  return window.api.logView.deleteAllRequestLogs({}, query, {});
}
