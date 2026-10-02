import React from "react";
import mStyle from "./RequestLogDetailPage.module.scss";

const RequestBodyCard: React.FunctionComponent<{
  query: any;
}> = ({ query }) => {
  return (
    <div className={mStyle.card}>
      <div className={mStyle.card_til}>Request Query</div>
      <div className={mStyle.card_content}>
        <pre className={mStyle.json_pre}>{JSON.stringify(query, null, 2)}</pre>
      </div>
    </div>
  );
};

export default RequestBodyCard;
