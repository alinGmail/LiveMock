import mStyle from "./RequestLogDetailPage.module.scss";

const RequestBodyCard = () => {
  return (
    <div className={mStyle.card}>
      <div className={mStyle.card_til}>Request Body</div>
      <div className={mStyle.card_content}>
        <pre
            className={mStyle.json_pre}
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(
              {
                userId: "12345",
                action: "getData",
                parameters: {
                  limit: 10,
                  offset: 0,
                },
              },
              null,
              2,
            ),
          }}
        ></pre>
      </div>
    </div>
  );
};

export default RequestBodyCard;
