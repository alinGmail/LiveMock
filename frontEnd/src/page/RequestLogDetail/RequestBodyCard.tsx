import React from "react";
import mStyle from "./RequestLogDetailPage.module.scss";

const RequestBodyCard: React.FunctionComponent<{
  body: any;
}> = ({ body }) => {
  return (
    <div className={mStyle.card}>
      <div className={mStyle.card_til}>Request Body</div>
      <div className={mStyle.card_content}>
        <pre className={mStyle.json_pre}>{JSON.stringify(body, null, 2)}</pre>
      </div>
    </div>
  );
};

export default RequestBodyCard;
