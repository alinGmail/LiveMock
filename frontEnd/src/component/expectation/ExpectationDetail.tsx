import { Fragment } from "react";
import Toggle from "../Toggle";
import styles from "./ExpectationDetail.module.scss";
import { ExpectationM } from "livemock-core/struct/expectation";
import { ExpectationGroupM } from "livemock-core/struct/expectationGroup";
import {
  ActionM,
  ActionType,
  CustomResponseActionM,
  ProxyActionM,
  StaticDirectoryActionM,
} from "livemock-core/struct/action";
import {
  matcherHasName,
  matcherHasValue,
  RequestMatcherM,
} from "livemock-core/struct/matcher";
import {
  actionKind,
  actionLabel,
  conditionLabel,
  matcherName,
  matcherValue,
} from "./display";

const BADGE_CLASS = {
  custom: styles.badgeCustom,
  proxy: styles.badgeProxy,
  static: styles.badgeStatic,
};

function statusClass(status: number): string {
  if (status < 300) {
    return styles.statusOk;
  }
  if (status < 400) {
    return styles.statusInfo;
  }
  if (status < 500) {
    return styles.statusWarn;
  }
  return styles.statusErr;
}

const MatcherChip = ({ matcher }: { matcher: RequestMatcherM }) => {
  const name = matcherName(matcher);
  return (
    <div className={styles.matcher}>
      <span
        className={[styles.mtChip, styles.chipType].join(" ")}
        data-t={matcher.type}
      >
        {matcher.type}
      </span>
      {matcherHasName(matcher) && name ? (
        <span
          className={[styles.mtChip, styles.chipName].join(" ")}
          title="name"
        >
          {name}
        </span>
      ) : null}
      <span className={[styles.mtChip, styles.chipCond].join(" ")}>
        {conditionLabel(matcher.conditions)}
      </span>
      {matcherHasValue(matcher) ? (
        <span className={[styles.mtChip, styles.chipValue].join(" ")}>
          {matcherValue(matcher)}
        </span>
      ) : null}
    </div>
  );
};

const PencilIcon = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M12 20h9" />
    <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4z" />
  </svg>
);

const TrashIcon = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
  </svg>
);

const PlusIcon = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M12 5v14M5 12h14" />
  </svg>
);

const ActionBtns = ({
  onEdit,
  onDelete,
}: {
  onEdit?: () => void;
  onDelete?: () => void;
}) => (
  <span className={styles.actionBtns}>
    {onEdit ? (
      <button
        type="button"
        className={styles.actionBtn}
        aria-label="Edit action"
        title="Edit action"
        onClick={onEdit}
      >
        <PencilIcon />
      </button>
    ) : null}
    {onDelete ? (
      <button
        type="button"
        className={[styles.actionBtn, styles.actionBtnDanger].join(" ")}
        aria-label="Delete action"
        title="Delete action"
        onClick={onDelete}
      >
        <TrashIcon />
      </button>
    ) : null}
  </span>
);

const HeaderGrid = ({ rows }: { rows?: Array<[string, string]> | null }) => {
  if (!rows || rows.length === 0) {
    return <span className={styles.mutedText}>none</span>;
  }
  return (
    <div className={styles.kvGrid}>
      {rows.map((row, index) => (
        <Fragment key={index}>
          <div className={[styles.kvK, styles.mono].join(" ")}>{row[0]}</div>
          <div className={[styles.kvV, styles.mono].join(" ")}>{row[1]}</div>
        </Fragment>
      ))}
    </div>
  );
};

const ActionView = ({
  action,
  onEdit,
  onDelete,
}: {
  action: ActionM;
  onEdit?: () => void;
  onDelete?: () => void;
}) => {
  const badge = (
    <span
      className={[styles.typeBadge, BADGE_CLASS[actionKind(action.type)]].join(
        " ",
      )}
    >
      {actionLabel(action.type)}
    </span>
  );

  if (action.type === ActionType.CUSTOM_RESPONSE) {
    const custom = action as CustomResponseActionM;
    const response = custom.responseContent;
    return (
      <div>
        <div className={styles.actionTop}>
          {badge}
          <ActionBtns onEdit={onEdit} onDelete={onDelete} />
        </div>
        <div className={styles.fieldRow}>
          <span className={styles.k}>Status</span>
          <span
            className={[
              styles.v,
              styles.mono,
              statusClass(custom.status),
            ].join(" ")}
          >
            {custom.status}
          </span>
        </div>
        <div className={styles.fieldRow}>
          <span className={styles.k}>Response type</span>
          <span className={[styles.v, styles.mono].join(" ")}>
            {response.type}
          </span>
        </div>
        <div className={styles.fieldRow}>
          <span className={styles.k}>Content handler</span>
          <span className={[styles.v, styles.mono].join(" ")}>
            {response.contentHandler ?? "NONE"}
          </span>
        </div>
        <div className={[styles.fieldRow, styles.fieldRowTop].join(" ")}>
          <span className={styles.k}>Headers</span>
          <span className={[styles.v, styles.vFlex].join(" ")}>
            <HeaderGrid rows={response.headers} />
          </span>
        </div>
        {response.value ? (
          <pre className={styles.code}>{response.value}</pre>
        ) : (
          <div className={styles.fieldRow}>
            <span className={styles.k}>Body</span>
            <span className={[styles.v, styles.mutedText].join(" ")}>
              empty
            </span>
          </div>
        )}
      </div>
    );
  }

  if (action.type === ActionType.PROXY) {
    const proxy = action as ProxyActionM;
    const target = proxy.host ? `${proxy.protocol}://${proxy.host}` : "";
    return (
      <div>
        <div className={styles.actionTop}>
          {badge}
          <ActionBtns onEdit={onEdit} onDelete={onDelete} />
        </div>
        <div className={styles.fieldRow}>
          <span className={styles.k}>Target host</span>
          <span className={[styles.v, styles.mono].join(" ")}>
            {target || "—"}
          </span>
        </div>
        <div className={styles.fieldRow}>
          <span className={styles.k}>Prefix remove</span>
          <span className={[styles.v, styles.mono].join(" ")}>
            {proxy.prefixRemove || "—"}
          </span>
        </div>
        <div className={[styles.fieldRow, styles.fieldRowTop].join(" ")}>
          <span className={styles.k}>Request headers</span>
          <span className={[styles.v, styles.vFlex].join(" ")}>
            <HeaderGrid rows={proxy.requestHeaders} />
          </span>
        </div>
        <div className={[styles.fieldRow, styles.fieldRowTop].join(" ")}>
          <span className={styles.k}>Response headers</span>
          <span className={[styles.v, styles.vFlex].join(" ")}>
            <HeaderGrid rows={proxy.headers} />
          </span>
        </div>
        <div className={styles.fieldRow}>
          <span className={styles.k}>Cross config</span>
          <span className={[styles.v, styles.mono].join(" ")}>
            {proxy.handleCross ? "handle cross" : "off"}
            {proxy.crossAllowCredentials ? " · allow credentials" : ""}
          </span>
        </div>
        <div className={styles.fieldRow}>
          <span className={styles.k}>Websocket</span>
          <span className={[styles.v, styles.mono].join(" ")}>
            {proxy.supportWebsocket ? "supported" : "off"}
          </span>
        </div>
        {proxy.pathRewrite && proxy.pathRewrite.length ? (
          <div className={styles.fieldRow}>
            <span className={styles.k}>Path rewrite</span>
            <span className={[styles.v, styles.mono].join(" ")}>
              {proxy.pathRewrite
                .map((rule) => `${rule.type}: ${rule.value}`)
                .join(", ")}
            </span>
          </div>
        ) : null}
      </div>
    );
  }

  const staticAction = action as StaticDirectoryActionM;
  return (
    <div>
      <div className={styles.actionTop}>
        {badge}
        <ActionBtns onEdit={onEdit} onDelete={onDelete} />
      </div>
      <div className={styles.fieldRow}>
        <span className={styles.k}>URL prefix</span>
        <span className={[styles.v, styles.mono].join(" ")}>
          {staticAction.urlPrefix || "—"}
        </span>
      </div>
      <div className={styles.fieldRow}>
        <span className={styles.k}>Folder</span>
        <span className={[styles.v, styles.mono].join(" ")}>
          {staticAction.folderPath || "—"}
        </span>
      </div>
    </div>
  );
};

interface ExpectationDetailProps {
  expectation: ExpectationM | null;
  group: ExpectationGroupM | null;
  onEditAction?: () => void;
  onDeleteAction?: () => void;
  onAddAction?: () => void;
  onEditDescription?: () => void;
  onEditMatchers?: () => void;
  onEditTiming?: () => void;
  onToggleActive?: () => void;
}

const ExpectationDetail = ({
  expectation,
  group,
  onEditAction,
  onDeleteAction,
  onAddAction,
  onEditDescription,
  onEditMatchers,
  onEditTiming,
  onToggleActive,
}: ExpectationDetailProps) => {
  if (!expectation) {
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
              <path d="m12 2 9 5-9 5-9-5 9-5z" />
              <path d="m3 12 9 5 9-5" />
              <path d="m3 17 9 5 9-5" />
            </svg>
          </span>
          <h3>Select an expectation</h3>
          <p>
            Pick a row on the left to inspect its matchers, action and timing.
          </p>
        </div>
      </div>
    );
  }

  const firstAction = expectation.actions?.[0];
  const groupName = group?.name || "ungrouped";

  return (
    <div className={styles.detail}>
      <div className={styles.detailHead}>
        <div className={styles.crumb}>
          <b>{group ? group.name || "unnamed group" : "Ungrouped"}</b>
          <span className={styles.sep}>/</span>
          <span>Expectation</span>
        </div>
        <div className={styles.headRow}>
          <h2 className={styles.title}>{expectation.name || "empty"}</h2>
          <div className={styles.headActions}>
            <Toggle
              checked={expectation.activate}
              onChange={() => onToggleActive?.()}
              label="Toggle active"
              disabled={!onToggleActive}
            />
          </div>
        </div>
        <div className={styles.chips}>
          <span className={styles.chip}>
            <span className={styles.chipKey}>group</span>
            {groupName}
          </span>
          <span className={styles.chip}>
            <span className={styles.chipKey}>delay</span>
            {expectation.delay} ms
          </span>
          <span className={styles.chip}>
            <span className={styles.chipKey}>priority</span>
            {expectation.priority}
          </span>
          <span
            className={[
              styles.chip,
              expectation.activate ? styles.chipOk : styles.chipOff,
            ].join(" ")}
          >
            <span className={styles.chipKey}>status</span>
            {expectation.activate ? "active" : "inactive"}
          </span>
        </div>
      </div>

      <div className={styles.detailBody}>
        <div className={styles.stack}>
          <section className={styles.card}>
            <div className={styles.cardHead}>
              <h3>Description</h3>
              <span className={styles.hint}>optional</span>
              {onEditDescription ? (
                <span className={styles.actionBtns}>
                  <button
                    type="button"
                    className={styles.actionBtn}
                    aria-label="Edit description"
                    title="Edit description"
                    onClick={onEditDescription}
                  >
                    <PencilIcon />
                  </button>
                </span>
              ) : null}
            </div>
            <div className={styles.cardBody}>
              {expectation.description ? (
                <p className={styles.desc}>{expectation.description}</p>
              ) : (
                <span className={styles.mutedText}>
                  This expectation has no description.
                </span>
              )}
            </div>
          </section>

          <section className={styles.card}>
            <div className={styles.cardHead}>
              <h3>Matchers</h3>
              <span className={styles.hint}>every matcher must match</span>
              {onEditMatchers ? (
                <span className={styles.actionBtns}>
                  <button
                    type="button"
                    className={styles.actionBtn}
                    aria-label="Edit matchers"
                    title="Edit matchers"
                    onClick={onEditMatchers}
                  >
                    <PencilIcon />
                  </button>
                </span>
              ) : null}
            </div>
            <div className={styles.cardBody}>
              {expectation.matchers && expectation.matchers.length ? (
                <div className={styles.matcherList}>
                  {expectation.matchers.map((matcher) => (
                    <MatcherChip key={matcher.id} matcher={matcher} />
                  ))}
                </div>
              ) : (
                <span className={styles.mutedText}>no matchers</span>
              )}
            </div>
          </section>

          <section className={styles.card}>
            <div className={styles.cardHead}>
              <h3>Action</h3>
              <span className={styles.hint}>what happens on a match</span>
            </div>
            <div className={styles.cardBody}>
              {firstAction ? (
                <ActionView
                  action={firstAction}
                  onEdit={onEditAction}
                  onDelete={onDeleteAction}
                />
              ) : (
                <div className={styles.noAction}>
                  <span className={styles.mutedText}>no action</span>
                  {onAddAction ? (
                    <button
                      type="button"
                      className={styles.addActionBtn}
                      onClick={onAddAction}
                    >
                      <PlusIcon />
                      Add action
                    </button>
                  ) : null}
                </div>
              )}
            </div>
          </section>

          <section className={styles.card}>
            <div className={styles.cardHead}>
              <h3>Timing &amp; state</h3>
              {onEditTiming ? (
                <span className={styles.actionBtns}>
                  <button
                    type="button"
                    className={styles.actionBtn}
                    aria-label="Edit timing and state"
                    title="Edit timing and state"
                    onClick={onEditTiming}
                  >
                    <PencilIcon />
                  </button>
                </span>
              ) : null}
            </div>
            <div className={styles.cardBody}>
              <div className={styles.fields}>
                <div className={styles.field}>
                  <span className={styles.fieldLabel}>Delay (ms)</span>
                  <span className={styles.fieldValue}>{expectation.delay}</span>
                </div>
                <div className={styles.field}>
                  <span className={styles.fieldLabel}>Priority</span>
                  <span className={styles.fieldValue}>
                    {expectation.priority}
                  </span>
                </div>
                <div className={styles.field}>
                  <span className={styles.fieldLabel}>Group</span>
                  <span className={styles.fieldValue}>{groupName}</span>
                </div>
                <div className={styles.field}>
                  <span className={styles.fieldLabel}>Active</span>
                  <span className={styles.fieldValue}>
                    {expectation.activate ? "enabled" : "disabled"}
                  </span>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default ExpectationDetail;
