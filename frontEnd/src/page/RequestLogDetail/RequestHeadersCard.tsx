import mStyle from "./RequestLogDetailPage.module.scss";

const RequestHeadersCard = () => {
  return (
    <div className={mStyle.card}>
      <div className={mStyle.card_til}>Request Headers</div>
      <div className={mStyle.card_content}>
        <div className={mStyle.property_row}>
          <div className={mStyle.pro_label}>Content-Type</div>
          <div className={mStyle.pro_value}>application/json</div>
        </div>
        <div className={mStyle.property_row}>
          <div className={mStyle.pro_label}>Accept</div>
          <div className={mStyle.pro_value}>*/*</div>
        </div>
      </div>
    </div>
  );
};

export default RequestHeadersCard;
