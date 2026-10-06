import React, { useCallback, useState } from "react";
import {
  App,
  Button,
  Checkbox,
  Input,
  InputNumber,
  Modal,
  Select,
  Space,
} from "antd";
import { ReloadOutlined } from "@ant-design/icons";
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
import { useAppSelector } from "../../store";
import moduleStyle from "./MockFromLogModal.module.scss";

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

/**
 * Dialog that creates a mock expectation from a captured request log. It is a
 * controlled `antd` modal; all of its editable state lives in a single
 * `LogExpectationDraft` handled with `use-immer` so editing one row does not
 * rebuild the whole list.
 */
export function MockFromLogModal(props: MockFromLogModalProps) {
  if (!props.log) {
    return null;
  }
  return (
    <MockFromLogModalContent
      key={props.log.id}
      projectId={props.projectId}
      log={props.log}
      open={props.open}
      onClose={props.onClose}
      onSaved={props.onSaved}
    />
  );
}

const MockFromLogModalContent: React.FC<{
  projectId: string;
  log: LogM;
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
}> = ({ projectId, log, open, onClose, onSaved }) => {
  const { message } = App.useApp();
  const systemConfigState = useAppSelector((state) => state.systemConfig);
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
      return <div className={moduleStyle.empty}>No entries captured</div>;
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
          <Button
            type="link"
            size="small"
            style={{ paddingLeft: 4 }}
            onClick={() =>
              setExpanded((prev) => ({ ...prev, [slot]: !isExpanded }))
            }
          >
            {isExpanded ? "Show less" : `Show all ${rows.length}`}
          </Button>
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
      await createExpectationReq(projectId, buildExpectationFromDraft(draft));
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
      open={open}
      width={780}
      onCancel={onClose}
      footer={null}
      maskClosable={false}
    >
      <div className={moduleStyle.body}>
        <div className={moduleStyle.fieldLine}>
          <span className={moduleStyle.fieldLabel}>Name</span>
          <Input
            aria-label="Expectation name"
            value={draft.name}
            placeholder="Expectation name"
            onChange={(event) =>
              setDraft((current) => {
                current.name = event.target.value;
              })
            }
          />
        </div>

        <div className={moduleStyle.panel}>
          <div className={moduleStyle.panelHead}>
            <span>Matchers</span>
            <span className={moduleStyle.panelHeadHint}>
              Only checked fields are matched
            </span>
          </div>
          <div className={moduleStyle.panelBody}>
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

            <div className={moduleStyle.subHead}>
              <span>Query</span>
              <span className={moduleStyle.subCount}>{draft.query.length}</span>
            </div>
            {renderRows("query", draft.query, true)}

            <div className={moduleStyle.subHead}>
              <span>Request params</span>
              <span className={moduleStyle.subCount}>{draft.param.length}</span>
            </div>
            {renderRows("param", draft.param, true)}
          </div>
        </div>

        <div className={moduleStyle.panel}>
          <div className={moduleStyle.panelHead}>
            <span>Response</span>
            <span className={moduleStyle.panelHeadHint}>
              always returns JSON
            </span>
          </div>
          <div className={moduleStyle.panelBody}>
            <div className={moduleStyle.fieldLine}>
              <span className={moduleStyle.fieldLabel}>Status</span>
              <div>
                <InputNumber
                  aria-label="Response status"
                  style={{ width: 160 }}
                  value={draft.status}
                  onChange={(value) => {
                    if (value !== null) {
                      setDraft((current) => {
                        current.status = value;
                      });
                    }
                  }}
                />
              </div>
            </div>

            <div className={moduleStyle.subHead}>
              <span>Headers</span>
              <span className={moduleStyle.subCount}>{draft.header.length}</span>
            </div>
            {renderRows("header", draft.header, false)}

            <div className={moduleStyle.subHead}>
              <span>Body</span>
            </div>
            <div
              className={[
                moduleStyle.editorWrap,
                jsonInvalid ? moduleStyle.editorError : "",
              ].join(" ")}
            >
              <Editor
                height="220px"
                language="json"
                theme={systemConfigState.mode === "dark" ? "vs-dark" : "light"}
                value={draft.content}
                options={{
                  lineNumbers: "off",
                  minimap: { enabled: false },
                  scrollBeyondLastLine: false,
                  wordWrap: "on",
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
              <div className={moduleStyle.errorText} role="alert">
                Response content is not valid JSON
              </div>
            )}
          </div>
        </div>
      </div>

      <div className={moduleStyle.footer}>
        <Button icon={<ReloadOutlined />} onClick={handleReset}>
          Reset
        </Button>
        <Space>
          <Button onClick={onClose}>Cancel</Button>
          <Button type="primary" loading={saving} onClick={handleSave}>
            Save
          </Button>
        </Space>
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
        moduleStyle.row,
        showCondition ? "" : moduleStyle.rowNoCondition,
      ].join(" ")}
    >
      <Checkbox
        className={moduleStyle.rowField}
        checked={row.checked}
        aria-label={`match ${label}`}
        onChange={(event) =>
          onChange(slot, row.key, { checked: event.target.checked })
        }
      >
        <span className={moduleStyle.rowLabel} title={label}>
          {label}
        </span>
      </Checkbox>
      {showCondition && (
        <Select
          size="small"
          className={moduleStyle.rowCondition}
          value={row.condition}
          options={CONDITION_OPTIONS}
          aria-label={`${label} condition`}
          onChange={(value) => onChange(slot, row.key, { condition: value })}
        />
      )}
      <Input
        size="small"
        className={moduleStyle.rowValue}
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
