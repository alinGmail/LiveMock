import mStyle from "./RequestLogDetailPage.module.scss";
import RequestHeadersCard from "./RequestHeadersCard";





const RequestLogDetailPage = () => {
  return (
    <div className={mStyle.req_log_detail}>
      <div className={mStyle.req_tile}>
        <div className={mStyle.til_left}>
          <div className={mStyle.req_method}>GET</div>
          <div className={mStyle.req_path}>/api/v1/users</div>
        </div>
        <div className={mStyle.til_right}>
          <div className={mStyle.req_time}>2025-01-10 12:00:00</div>
          <div className={mStyle.req_status}>200</div>
        </div>
      </div>

      <div className={mStyle.req_content}>
        <div className={mStyle.request_col}>
          <RequestHeadersCard />
        </div>
        <div className={mStyle.response_col}></div>
      </div>
    </div>
  );
};

export default RequestLogDetailPage;
