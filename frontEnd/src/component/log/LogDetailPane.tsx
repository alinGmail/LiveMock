import { ReactNode, useMemo, useState } from "react";
import { ExpectationM } from "livemock-core/struct/expectation";
import { LogM } from "livemock-core/struct/log";
import btn from "../buttonStyles.module.scss";
import styles from "./LogDetailPane.module.scss";

type TabId = "overview" | "request" | "response" | "websocket";

function actionBrief(expectation: ExpectationM | undefined): string {
  const action = expectation?.actions?.[0];
  if (!action) {
    return "no action";
  }
  if (action.type === "CUSTOM_RESPONSE") {
    const custom = action as { status: number };
    return `response ${custom.status}`;
  }
  if (action.type === "PROXY") {
    const proxy = action as { host: string };
    return `proxy to ${proxy.host}`;
  }
  const staticAction = action as { urlPrefix: string; folderPath: string };
  return `static ${staticAction.urlPrefix} -> ${staticAction.folderPath}`;
}

const HighlightedJson = ({ data }: { data: unknown }) => {
  const nodes = useMemo(() => {
    const text = JSON.stringify(data, null, 2);
    const out: Array<ReactNode> = [];
    const re =
      /("(?:\\.|[^"\\])*")(\s*:)?|\b(true|false|null)\b|(-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?)/g;
    let last = 0;
    let match: RegExpExecArray | null;
    let key = 0;
    while ((match = re.exec(text))) {
      if (match.index > last) {
        out.push(text.slice(last, match.index));
      }
      if (match[1] !== undefined) {
        if (match[2] !== undefined) {
          out.push(
            <span key={key++} className={styles.jKey}>
              {match[1]}
            </span>,
          );
          out.push(match[2]);
        } else {
          out.push(
            <span key={key++} className={styles.jStr}>
              {match[1]}
            </span>,
          );
        }
      } else if (match[3] !== undefined) {
        out.push(
          <span key={key++} className={styles.jBool}>
            {match[3]}
          </span>,
        );
      } else {
        out.push(
          <span key={key++} className={styles.jNum}>
            {match[4]}
          </span>,
        );
      }
      last = re.lastIndex;
    }
    if (last < text.length) {
      out.push(text.slice(last));
    }
    return out;
  }, [data]);
  return <pre className={styles.json}>{nodes}</pre>;
};

const Body = ({ body }: { body: unknown }) => {
  if (body == null) {
    return <div className={styles.muted}>empty</div>;
  }
  if (typeof body === "string") {
    return <pre className={styles.json}>{body}</pre>;
  }
  return <HighlightedJson data={body} />;
};

const KvGrid = ({ rows }: { rows: Array<[string, string]> }) => {
  if (rows.length === 0) {
    return <div className={styles.muted}>none</div>;
  }
  return (
    <div className={styles.kvGrid}>
      {rows.map((row, index) => (
        <FragmentLike key={index} k={row[0]} v={row[1]} />
      ))}
    </div>
  );
};

const FragmentLike = ({ k, v }: { k: string; v: string }) => (
  <>
    <div className={[styles.kvK, styles.mono].join(" ")}>{k}</div>
    <div className={[styles.kvV, styles.mono].join(" ")}>{v}</div>
  </>
);

const headerRows = (
  headers: { [key: string]: string | undefined | null } | undefined,
): Array<[string, string]> =>
  Object.entries(headers ?? {}).map(([k, v]) => [k, String(v ?? "")]);

const queryRows = (
  query: { [key: string]: unknown } | undefined,
): Array<[string, string]> =>
  Object.entries(query ?? {}).map(([k, v]) => [
    k,
    Array.isArray(v) ? v.join(", ") : String(v),
  ]);

const SummaryItem = ({ k, v }: { k: string; v: string }) => (
  <div className={styles.summaryItem}>
    <span className={styles.k}>{k}</span>
    <span className={[styles.v, styles.mono].join(" ")}>{v}</span>
  </div>
);

interface LogDetailPaneProps {
  log: LogM | null;
  expectations: { [id: string]: ExpectationM };
  onMock?: () => void;
}

const LogDetailPane = ({ log, expectations, onMock }: LogDetailPaneProps) => {
  const [tab, setTab] = useState<TabId>("overview");

  if (!log) {
    return (
      <div className={styles.detail}>
        <div className={styles.empty}>
          <span className={styles.emptyGlyph}>
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" />
            </svg>
          </span>
          <h3>Select a request</h3>
          <p>Pick a row on the left to inspect its headers, body and response.</p>
        </div>
      </div>
    );
  }

  const expectation = log.expectationId
    ? expectations[log.expectationId]
    : undefined;
  const method = log.req?.method?.toUpperCase() ?? "";
  const path = log.req?.path ?? "";
  const status = log.res?.status ?? null;
  const statusText = log.res?.statusMessage ?? "";
  const duration = log.res?.duration;
  const time = log.req?.requestTimeStr ?? "";
  const isWebsocket = !!log.websocketInfo?.isWebsocket;

  const tabs: Array<[TabId, string]> = [
    ["overview", "Overview"],
    ["request", "Request"],
    ["response", "Response"],
    ...(isWebsocket ? ([["websocket", "Websocket"]] as Array<[TabId, string]>) : []),
  ];
  const activeTab = tabs.some(([id]) => id === tab) ? tab : "overview";

  const chips = (
    <div className={styles.chips}>
      <span className={styles.chip}>
        <span className={styles.chipKey}>status</span>
        {status == null ? "pending" : `${status} ${statusText}`}
      </span>
      <span className={styles.chip}>
        <span className={styles.chipKey}>duration</span>
        {duration == null ? "—" : `${duration} ms`}
      </span>
      <span className={styles.chip}>
        <span className={styles.chipKey}>time</span>
        <span className={styles.mono}>{time}</span>
      </span>
      <span className={styles.chip}>
        <span className={styles.chipKey}>matched</span>
        {expectation ? expectation.name : "none"}
      </span>
    </div>
  );

  let body: ReactNode;
  if (activeTab === "overview") {
    body = (
      <div className={styles.stack}>
        <section className={styles.card}>
          <div className={styles.cardHead}>
            <h3>Summary</h3>
          </div>
          <div className={styles.cardBody}>
            <div className={styles.summaryGrid}>
              <SummaryItem k="method" v={method} />
              <SummaryItem k="path" v={path} />
              <SummaryItem
                k="status"
                v={status == null ? "pending" : `${status} ${statusText}`}
              />
              <SummaryItem
                k="duration"
                v={duration == null ? "—" : `${duration} ms`}
              />
              <SummaryItem k="request time" v={time} />
              <SummaryItem
                k="matched"
                v={expectation ? expectation.name : "no expectation"}
              />
            </div>
          </div>
        </section>
        <section className={styles.card}>
          <div className={styles.cardHead}>
            <h3>Matched expectation</h3>
            <span className={styles.hint}>
              {expectation ? "first match wins" : "fell through"}
            </span>
          </div>
          <div className={styles.cardBody}>
            {expectation ? (
              <>
                <SummaryItem k="name" v={expectation.name} />
                <div style={{ height: 8 }} />
                <div className={[styles.mono, styles.muted].join(" ")}>
                  {actionBrief(expectation)}
                </div>
              </>
            ) : (
              <div className={styles.muted}>
                No expectation matched this request.
              </div>
            )}
          </div>
        </section>
        {log.proxyInfo?.isProxy ? (
          <section className={styles.card}>
            <div className={styles.cardHead}>
              <h3>Proxy</h3>
              <span className={styles.hint}>forwarded</span>
            </div>
            <div className={styles.cardBody}>
              <div className={[styles.mono].join(" ")}>
                {`${log.proxyInfo.proxyHost ?? ""}${log.proxyInfo.proxyPath ?? ""}`}
              </div>
              <div style={{ height: 12 }} />
              <h3 className={styles.hint}>Request headers</h3>
              <KvGrid
                rows={(log.proxyInfo.requestHeaders ?? []).map((h) => [
                  h.name,
                  h.value,
                ])}
              />
              {(log.proxyInfo.responseHeaders ?? []).length ? (
                <>
                  <div style={{ height: 12 }} />
                  <h3 className={styles.hint}>Response headers</h3>
                  <KvGrid
                    rows={(log.proxyInfo.responseHeaders ?? []).map((h) => [
                      h.name,
                      h.value,
                    ])}
                  />
                </>
              ) : null}
            </div>
          </section>
        ) : null}
      </div>
    );
  } else if (activeTab === "request") {
    const query = queryRows(log.req?.query as { [key: string]: unknown });
    body = (
      <div className={styles.stack}>
        <div className={styles.statusLine}>{`${method} ${path} HTTP/1.1`}</div>
        <section className={styles.card}>
          <div className={styles.cardHead}>
            <h3>Headers</h3>
          </div>
          <div className={styles.cardBody}>
            <KvGrid rows={headerRows(log.req?.headers)} />
          </div>
        </section>
        {query.length ? (
          <section className={styles.card}>
            <div className={styles.cardHead}>
              <h3>Query</h3>
            </div>
            <div className={styles.cardBody}>
              <KvGrid rows={query} />
            </div>
          </section>
        ) : null}
        <section className={styles.card}>
          <div className={styles.cardHead}>
            <h3>Body</h3>
          </div>
          <div className={styles.cardBody}>
            <Body body={log.req?.body} />
          </div>
        </section>
      </div>
    );
  } else if (activeTab === "response") {
    body = log.res ? (
      <div className={styles.stack}>
        <div className={styles.statusLine}>
          {`HTTP/1.1 ${log.res.status} ${log.res.statusMessage ?? ""}`}
        </div>
        <section className={styles.card}>
          <div className={styles.cardHead}>
            <h3>Headers</h3>
          </div>
          <div className={styles.cardBody}>
            <KvGrid rows={headerRows(log.res.headers)} />
          </div>
        </section>
        <section className={styles.card}>
          <div className={styles.cardHead}>
            <h3>Body</h3>
          </div>
          <div className={styles.cardBody}>
            <Body body={log.res.body} />
          </div>
        </section>
      </div>
    ) : (
      <div className={styles.stack}>
        <div className={styles.statusLine}>
          {`${method} ${path} HTTP/1.1\n\nawaiting response…`}
        </div>
        <section className={styles.card}>
          <div className={styles.cardHead}>
            <h3>Response</h3>
            <span className={styles.hint}>pending</span>
          </div>
          <div className={styles.cardBody}>
            <div className={styles.muted}>
              The request has not received a response yet.
            </div>
          </div>
        </section>
      </div>
    );
  } else {
    const messages = log.websocketInfo?.messages ?? [];
    body = (
      <div className={styles.stack}>
        <section className={styles.card}>
          <div className={styles.cardHead}>
            <h3>WebSocket</h3>
            <span className={[styles.hint, styles.mono].join(" ")}>
              {log.websocketInfo?.status ?? ""}
            </span>
          </div>
          <div className={styles.cardBody}>
            <div className={styles.msgList}>
              {messages.map((message, index) => (
                <div
                  key={index}
                  className={[
                    styles.msg,
                    message.sendFromClient ? styles.msgClient : styles.msgServer,
                  ].join(" ")}
                >
                  <span className={styles.msgMeta}>
                    {message.sendFromClient
                      ? "client → server"
                      : "server → client"}
                    {" · "}
                    {new Date(message.sendTime).toLocaleTimeString()}
                  </span>
                  {message.content}
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className={styles.detail}>
      <div className={styles.detailHead}>
        <div className={styles.dhTop}>
          <span className={styles.dhMethod}>{method}</span>
          <span className={styles.dhPath}>{path}</span>
          <span className={styles.grow} />
          <span
            className={styles.mockWrap}
            title={log.req ? undefined : "No request to mock"}
          >
            <button
              type="button"
              className={[btn.btn, btn.primary].join(" ")}
              disabled={!log.req || !onMock}
              onClick={onMock}
            >
              Mock this request
            </button>
          </span>
        </div>
        {chips}
      </div>
      <div className={styles.tabs} role="tablist">
        {tabs.map(([id, label]) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={activeTab === id}
            className={[styles.tab, activeTab === id ? styles.tabActive : ""].join(
              " ",
            )}
            onClick={() => setTab(id)}
          >
            {label}
          </button>
        ))}
      </div>
      <div className={styles.detailBody}>{body}</div>
    </div>
  );
};

export default LogDetailPane;
