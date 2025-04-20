import React from "react";
import mStyle from "./RequestLogDetailPage.module.scss";

const RequestHeadersCard: React.FunctionComponent<{
  headers: {
    [key: string]: string | null | undefined;
  };
}> = ({ headers }) => {
  return (
    <div className={mStyle.card}>
      <div className={mStyle.card_til}>Request Headers</div>
      <div className={mStyle.card_content}>
        {Object.keys(headers).map((key: string) => {
          return (
            <div className={mStyle.property_row}>
              <div className={mStyle.pro_label}>{key}</div>
              <div className={mStyle.pro_value}>{headers[key] ?? ''}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default RequestHeadersCard;
