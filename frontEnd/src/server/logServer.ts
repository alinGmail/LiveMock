import {
  DeleteAllRequestLogsReqQuery,
  GetLogDetailReqQuery,
  GetLogDetailResponse,
  ListLogViewLogsReqQuery,
  ListLogViewReqQuery,
} from "livemock-core/struct/params/LogParams";
import * as superagent from "superagent";
import {
  DeleteAllRequestLogsResponse,
  ListLogViewLogsResponse,
  ListLogViewResponse,
} from "livemock-core/struct/response/LogResponse";

export async function listLogViewReq(
  query: ListLogViewReqQuery,
): Promise<ListLogViewResponse> {
  const response = await superagent
    .get(`/log/logView`)
    .query(query);
  return response.body;
}

export async function listLogViewLogs(
  logViewId: string,
  query: ListLogViewLogsReqQuery,
): Promise<ListLogViewLogsResponse> {
  const response = await superagent
    .get(`/log/logViewLogs/${logViewId}`)
    .query(query);
  return response.body;
}

export async function deleteAllRequestLogs(
  query: DeleteAllRequestLogsReqQuery,
): Promise<DeleteAllRequestLogsResponse> {
  const response = await superagent.delete(`/log`).query(query);
  return response.body;
}

export async function getRequestLogDetail(
  logId: number,
  query: GetLogDetailReqQuery,
): Promise<GetLogDetailResponse> {
  const response = await superagent
    .get(`/log/detail/${logId}`)
    .query(query);
  return response.body;
}
