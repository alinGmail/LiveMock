import mStyle from "./RequestLogDetailPage.module.scss";
import RequestHeadersCard from "./RequestHeadersCard";
import RequestBodyCard from "./RequestBodyCard";
import { useLocation, useParams, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { getRequestLogDetail } from "../../server/logServer";
import { useAppSelector } from "../../store";
import { ClockCircleOutlined } from "@ant-design/icons";

const RequestLogDetailPage = () => {
  const params = useParams<{
    logId: string;
  }>();
  const [searchParam, setSearchParam] = useSearchParams();
  const projectId = searchParam.get("projectId");
  if (projectId === null) {
    throw new Error("No projectId provided");
  }
  const getLogDetailQuery = useQuery([params.logId], () => {
    if (!params.logId) {
      throw new Error("No log detail found.");
    }
    return getRequestLogDetail(parseInt(params.logId), {
      projectId: projectId,
    });
  });

  function getStatusClass(reqCode: number | undefined) {
    if (!reqCode) {
      return "";
    }
    if (reqCode < 200) {
      return mStyle.req_status_processing;
    } else if (reqCode < 300) {
      return mStyle.req_status_success;
    } else if (reqCode < 400) {
      return mStyle.req_status_processing;
    } else {
      return mStyle.req_status_error;
    }
  }

  return (
    <div className={mStyle.req_log_detail}>
      <div className={mStyle.req_tile}>
        <div className={mStyle.til_left}>
          <div className={mStyle.req_method}>
            {getLogDetailQuery.data?.logItem.req?.method}
          </div>
          <div className={mStyle.req_path}>
            {getLogDetailQuery.data?.logItem.req?.path}
          </div>
        </div>
        <div className={mStyle.til_right}>
          <div className={mStyle.req_time}>
            <ClockCircleOutlined /> 2025-01-10 12:00:00
          </div>
          <div
            className={[
              mStyle.req_status,
              getStatusClass(getLogDetailQuery.data?.logItem.res?.status),
            ].join(" ")}
          >
            {getLogDetailQuery.data?.logItem.res?.status}
          </div>
        </div>
      </div>

      <div className={mStyle.req_content}>
        <div className={mStyle.request_col}>
          <RequestHeadersCard
            headers={getLogDetailQuery.data?.logItem.req?.headers ?? {}}
          />
          <div className={"blank20"}></div>
          <RequestBodyCard body={getLogDetailQuery.data?.logItem.req?.body} />
        </div>
        <div className={mStyle.response_col}>
          <RequestHeadersCard
            headers={getLogDetailQuery.data?.logItem.res?.headers ?? {}}
          />
          <div className={"blank20"}></div>
          <RequestBodyCard body={getLogDetailQuery.data?.logItem.res?.body} />
        </div>
      </div>
    </div>
  );
};

export default RequestLogDetailPage;
