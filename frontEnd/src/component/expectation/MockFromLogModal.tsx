import React, { useCallback, useState } from "react";
import { App } from "antd";
import Editor from "@monaco-editor/react";
import { useImmer } from "use-immer";
import {
  buildDraftFromLog,
  buildExpectationFromDraft,
  isValidJsonContent,
  LogExpectationDraft,
  DraftRow,
} from "livemock-core/import/fromLog";
import { MatcherCondition } from "livemock-core/struct/matcher";
import { LogM } from "livemock-core/struct/log";
import { createExpectationReq } from "../../server/expectationServer";
import { getErrorMessage } from "../common";
import Modal from "../Modal";
import Select from "../Select";
import { LIVEMOCK_DARK_THEME, defineLivemockDarkTheme } from "../monacoTheme";
import btn from "../buttonStyles.module.scss";
import styles from "./MockFromLogModal.module.scss";

const CONDITION_OPTIONS = Object.values(MatcherCondition).map((condition) => ({
  value: condition,
  label: condition,
}));

const FOLD_LIMIT = 30;

type RowSlot = "method" | "path" | "query" | "param" | "header";

interface MockFromLogModalProps {
  projectId: string;
  log: LogM | null;
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
}

const RefreshIcon = () => (
  <svg
    width={15}
    height={15}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M21 12a9 9 0 1 1-2.64-6.36" />
    <path d="M21 4v5h-5" />
  </svg>
);

/**
 * New-UI dialog that creates a mock expectation from a captured request log.
 * The editable state lives in a single `LogExpectationDraft` handled with
 * `use-immer`, so editing one row does not rebuild the whole list.
 */
export function MockFromLogModal(props: MockFromLogModalProps) {
  if (!props.log || !props.open) {
    return null;
  }
  return (
    <MockFromLogModalContent
      key={props.log.id}
      projectId={props.projectId}
      log={props.log}
      onClose={props.onClose}
      onSaved={props.onSaved}
    />
  );
}

const MockFromLogModalContent: React.FC<{
  projectId: string;
  log: LogM;
  onClose: () => void;
  onSaved: () => void;
}> = ({ projectId, log, onClose, onSaved }) => {
  const { message } = App.useApp();
  const [draft, setDraft] = useImmer<LogExpectationDraft>(() =>
    buildDraftFromLog(log)
  );
  const [saving, setSaving] = useState(false);
  const [expanded, setExpanded] = useState<{ [key: string]: boolean }>({});

  const onChange = useCallback(
    (slot: RowSlot, key: string, patch: Partial<DraftRow>) => {
      setDraft((current) => {
        const target = current[slot] as DraftRow | Array<DraftRow>;
        if (Array.isArray(target)) {
          const row = target.find((item) => item.key === key);
          if (row) {
            Object.assign(row, patch);
          }
        } else if (target) {
          Object.assign(target, patch);
        }
      });
    },
    [setDraft]
  );

  const renderRows = (
    slot: RowSlot,
    rows: Array<DraftRow>,
    showCondition: boolean
  ) => {
    if (rows.length === 0) {
      return <div className={styles.empty}>No entries captured</div>;
    }
    const isExpanded = !!expanded[slot];
    const visible = isExpanded ? rows : rows.slice(0, FOLD_LIMIT);
    return (
      <>
        {visible.map((row) => (
          <MatcherRow
            key={row.key}
            slot={slot}
            row={row}
            label={row.name ?? ""}
            showCondition={showCondition}
            onChange={onChange}
          />
        ))}
        {rows.length > FOLD_LIMIT && (
          <button
            type="button"
            className={[btn.btn, btn.ghost].join(" ")}
            onClick={() =>
              setExpanded((prev) => ({ ...prev, [slot]: !isExpanded }))
            }
          >
            {isExpanded ? "Show less" : `Show all ${rows.length}`}
          </button>
        )}
      </>
    );
  };

  const jsonInvalid =
    draft.content.trim() !== "" && !isValidJsonContent(draft.content);

  const handleReset = useCallback(() => {
    setDraft((current) => {
      Object.assign(current, buildDraftFromLog(log));
    });
    setExpanded({});
  }, [log, setDraft]);

  const handleSave = async () => {
    if (!isValidJsonContent(draft.content)) {
      message.error("Response content is not valid JSON");
      return;
    }
    setSaving(true);
    try {
      const expectation = buildExpectationFromDraft(draft);
      expectation.description = `Mocked from request ${log.req?.method ?? ""} ${
        log.req?.path ?? ""
      }`.trim();
      await createExpectationReq(projectId, expectation);
      message.success("Expectation created");
      onSaved();
      onClose();
    } catch (error) {
      message.error(getErrorMessage(error));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      title="Mock this request"
      size="lg"
      onClose={onClose}
      footer={
        <div className={styles.footer}>
          <button
            type="button"
            className={[btn.btn, btn.ghost].join(" ")}
            onClick={handleReset}
          >
            <RefreshIcon />
            Reset
          </button>
          <span className={styles.footerGrow} />
          <button
            type="button"
            className={[btn.btn, btn.ghost].join(" ")}
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            type="button"
            className={[btn.btn, btn.primary].join(" ")}
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? "Saving…" : "Save"}
          </button>
        </div>
      }
    >
      <div className={styles.form}>
        <label className={styles.field}>
          <span className={styles.fieldLabel}>Name</span>
          <input
            className={styles.input}
            aria-label="Expectation name"
            value={draft.name}
            placeholder="Expectation name"
            onChange={(event) =>
              setDraft((current) => {
                current.name = event.target.value;
              })
            }
          />
        </label>

        <section className={styles.panel}>
          <div className={styles.panelHead}>
            <span>Matchers</span>
            <span className={styles.hint}>Only checked fields are matched</span>
          </div>
          <div className={styles.panelBody}>
            <MatcherRow
              slot="method"
              row={draft.method}
              label="method"
              showCondition
              onChange={onChange}
            />
            <MatcherRow
              slot="path"
              row={draft.path}
              label="path"
              showCondition
              onChange={onChange}
            />

            <div className={styles.subHead}>
              <span>Query</span>
              <span className={styles.subCount}>{draft.query.length}</span>
            </div>
            {renderRows("query", draft.query, true)}

            <div className={styles.subHead}>
              <span>Request params</span>
              <span className={styles.subCount}>{draft.param.length}</span>
            </div>
            {renderRows("param", draft.param, true)}
          </div>
        </section>

        <section className={styles.panel}>
          <div className={styles.panelHead}>
            <span>Response</span>
            <span className={styles.hint}>always returns JSON</span>
          </div>
          <div className={styles.panelBody}>
            <label className={styles.field}>
              <span className={styles.fieldLabel}>Status</span>
              <input
                className={[styles.input, styles.statusInput].join(" ")}
                type="number"
                aria-label="Response status"
                value={draft.status}
                onChange={(event) => {
                  const value = parseInt(event.target.value, 10);
                  setDraft((current) => {
                    current.status = Number.isNaN(value) ? 0 : value;
                  });
                }}
              />
            </label>

            <div className={styles.subHead}>
              <span>Headers</span>
              <span className={styles.subCount}>{draft.header.length}</span>
            </div>
            {renderRows("header", draft.header, false)}

            <div className={styles.subHead}>
              <span>Body</span>
            </div>
            <div
              className={[
                styles.editorWrap,
                jsonInvalid ? styles.editorError : "",
              ].join(" ")}
            >
              <Editor
                height="220px"
                language="json"
                theme={LIVEMOCK_DARK_THEME}
                beforeMount={defineLivemockDarkTheme}
                value={draft.content}
                options={{
                  minimap: { enabled: false },
                  scrollBeyondLastLine: false,
                  fontSize: 13,
                  wordWrap: "on",
                  lineNumbers: "off",
                  lineNumbersMinChars: 3,
                  automaticLayout: true,
                }}
                onChange={(value) =>
                  setDraft((current) => {
                    current.content = value ?? "";
                  })
                }
              />
            </div>
            {jsonInvalid && (
              <div className={styles.errorText} role="alert">
                Response content is not valid JSON
              </div>
            )}
          </div>
        </section>
      </div>
    </Modal>
  );
};

const MatcherRow = React.memo(function MatcherRow({
  slot,
  row,
  label,
  showCondition,
  onChange,
}: {
  slot: RowSlot;
  row: DraftRow;
  label: string;
  showCondition: boolean;
  onChange: (slot: RowSlot, key: string, patch: Partial<DraftRow>) => void;
}) {
  return (
    <div
      className={[
        styles.row,
        showCondition ? "" : styles.rowNoCondition,
      ].join(" ")}
    >
      <label className={styles.rowCheck}>
        <input
          type="checkbox"
          checked={row.checked}
          aria-label={`match ${label}`}
          onChange={(event) =>
            onChange(slot, row.key, { checked: event.target.checked })
          }
        />
        <span className={styles.rowLabel} title={label}>
          {label}
        </span>
      </label>
      {showCondition && (
        <Select
          size="small"
          className={styles.rowCondition}
          value={row.condition}
          options={CONDITION_OPTIONS}
          aria-label={`${label} condition`}
          onChange={(value) => onChange(slot, row.key, { condition: value })}
        />
      )}
      <input
        className={[styles.input, styles.rowValue].join(" ")}
        value={row.value}
        placeholder="value"
        aria-label={`${label} value`}
        onChange={(event) =>
          onChange(slot, row.key, { value: event.target.value })
        }
      />
    </div>
  );
});
