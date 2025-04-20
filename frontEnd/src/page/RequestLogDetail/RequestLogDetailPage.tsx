import mStyle from "./RequestLogDetailPage.module.scss";
import RequestHeadersCard from "./RequestHeadersCard";
import RequestBodyCard from "./RequestBodyCard";
import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { getRequestLogDetail } from "../../server/logServer";
import { useAppSelector } from "../../store";

const RequestLogDetailPage = () => {
  const params = useParams<{
    logId: string;
  }>();
  const projectState = useAppSelector((state) => state.project);
  const currentProject = projectState.projectList[projectState.curProjectIndex];
  const getLogDetailQuery = useQuery([params.logId], () => {
    if (!params.logId) {
      throw new Error("No log detail found.");
    }
    return getRequestLogDetail(parseInt(params.logId), {
      projectId: currentProject.id,
    });
  });
  return (
    <div className={mStyle.req_log_detail}>
      <div className={mStyle.req_tile}>
        <div className={mStyle.til_left}>
          <div className={mStyle.req_method}>{getLogDetailQuery.data?.logItem.req?.method}</div>
          <div className={mStyle.req_path}>{getLogDetailQuery.data?.logItem.req?.path}</div>
        </div>
        <div className={mStyle.til_right}>
          <div className={mStyle.req_time}>2025-01-10 12:00:00</div>
          <div className={mStyle.req_status}>{getLogDetailQuery.data?.logItem.res?.status}</div>
        </div>
      </div>

      <div className={mStyle.req_content}>
        <div className={mStyle.request_col}>
          <RequestHeadersCard headers={getLogDetailQuery.data?.logItem.req?.headers ?? {}}/>
          <RequestBodyCard body={getLogDetailQuery.data?.logItem.req?.body}/>
        </div>
        <div className={mStyle.response_col}>
          <RequestHeadersCard headers={getLogDetailQuery.data?.logItem.res?.headers ?? {}}/>
          <RequestBodyCard body={getLogDetailQuery.data?.logItem.res?.body}/>
        </div>
      </div>
    </div>
  );
};

export default RequestLogDetailPage;
