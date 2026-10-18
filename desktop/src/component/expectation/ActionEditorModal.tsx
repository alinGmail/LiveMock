import { Input, Select as AntSelect } from "antd";
import { ReactNode, useEffect, useRef, useState } from "react";
import Editor from "@monaco-editor/react";
import {
  ActionM,
  ActionType,
  ContentHandler,
  CustomResponseActionM,
  getNewAction,
  ProxyActionM,
  ProxyProtocol,
  ResponseType,
  StaticDirectoryActionM,
} from "livemock-core/struct/action";
import Modal from "../Modal";
import Select from "../Select";
import { LIVEMOCK_DARK_THEME, defineLivemockDarkTheme } from "../monacoTheme";
import Toggle from "../Toggle";
import btn from "../buttonStyles.module.scss";
import styles from "./ActionEditorModal.module.scss";

const clone = <T,>(value: T): T => JSON.parse(JSON.stringify(value));

const SEGMENTS: Array<{ type: ActionType; label: string }> = [
  { type: ActionType.CUSTOM_RESPONSE, label: "Custom response" },
  { type: ActionType.PROXY, label: "Proxy" },
  { type: ActionType.STATIC_DIRECTORY, label: "Static" },
];

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

const XIcon = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M18 6 6 18M6 6l12 12" />
  </svg>
);

const HeaderRows = ({
  label,
  hint,
  rows,
  onChange,
}: {
  label: string;
  hint?: string;
  rows: Array<[string, string]>;
  onChange: (rows: Array<[string, string]>) => void;
}) => {
  const update = (index: number, key: 0 | 1, value: string) => {
    onChange(
      rows.map((row, i) =>
        i === index
          ? ((key === 0 ? [value, row[1]] : [row[0], value]) as [
              string,
              string,
            ])
          : row,
      ),
    );
  };
  return (
    <div className={styles.field}>
      <span className={styles.fieldLabel}>
        {label}
        {hint ? <span className={styles.hint}> · {hint}</span> : null}
      </span>
      <div className={styles.headerRows}>
        {rows.map((row, index) => (
          <div key={index} className={styles.headerRow}>
            <input
              className={styles.input}
              value={row[0]}
              placeholder="key"
              onChange={(event) => update(index, 0, event.target.value)}
            />
            <input
              className={styles.input}
              value={row[1]}
              placeholder="value"
              onChange={(event) => update(index, 1, event.target.value)}
            />
            <button
              type="button"
              className={[btn.btn, btn.ghost, btn.iconBtn].join(" ")}
              aria-label="Remove header"
              onClick={() => onChange(rows.filter((_, i) => i !== index))}
            >
              <XIcon />
            </button>
          </div>
        ))}
        <button
          type="button"
          className={styles.addRow}
          onClick={() => onChange([...rows, ["", ""]])}
        >
          <PlusIcon />
          Add header
        </button>
      </div>
    </div>
  );
};

interface ActionEditorModalProps {
  action: ActionM;
  saving: boolean;
  onSave: (action: ActionM) => void;
  onClose: () => void;
}

const ActionEditorModal = ({
  action,
  saving,
  onSave,
  onClose,
}: ActionEditorModalProps) => {
  const [draft, setDraft] = useState<ActionM>(() => clone(action));
  const bodyRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bodyRef.current
      ?.querySelector<HTMLElement>("input, select, textarea")
      ?.focus();
  }, [draft.type]);

  const switchType = (type: ActionType) => {
    if (draft.type === type) {
      return;
    }
    setDraft(getNewAction(draft.id, type) as ActionM);
  };

  const headerExtra = (
    <div className={styles.seg} role="tablist" aria-label="Action type">
      {SEGMENTS.map((segment) => (
        <button
          key={segment.type}
          type="button"
          role="tab"
          aria-selected={draft.type === segment.type}
          className={[
            styles.segBtn,
            draft.type === segment.type ? styles.segBtnActive : "",
          ].join(" ")}
          onClick={() => switchType(segment.type)}
        >
          {segment.label}
        </button>
      ))}
    </div>
  );

  let body: ReactNode;
  if (draft.type === ActionType.CUSTOM_RESPONSE) {
    const custom = draft as CustomResponseActionM;
    const content = custom.responseContent;
    const updateCustom = (patch: Partial<CustomResponseActionM>) =>
      setDraft((prev) => ({ ...(prev as CustomResponseActionM), ...patch }));
    const updateContent = (patch: Partial<typeof content>) =>
      updateCustom({
        responseContent: { ...content, ...patch } as typeof content,
      });
    body = (
      <div className={styles.form}>
        <div className={styles.fields}>
          <label className={styles.field}>
            <span className={styles.fieldLabel}>HTTP status</span>
            <input
              className={styles.input}
              type="number"
              value={custom.status}
              onChange={(event) =>
                updateCustom({ status: Number(event.target.value) || 0 })
              }
            />
          </label>
          <label className={styles.field}>
            <span className={styles.fieldLabel}>Response type</span>
            <Select
              value={content.type}
              onChange={(value) =>
                updateContent({ type: value as ResponseType })
              }
              options={[
                { value: ResponseType.JSON, label: "JSON" },
                { value: ResponseType.TEXT, label: "TEXT" },
              ]}
            />
          </label>
          <label className={styles.field}>
            <span className={styles.fieldLabel}>Content handler</span>
            <Select
              value={content.contentHandler ?? ContentHandler.NONE}
              onChange={(value) =>
                updateContent({ contentHandler: value as ContentHandler })
              }
              options={[
                { value: ContentHandler.NONE, label: "NONE" },
                { value: ContentHandler.MOCK_JS, label: "MOCK_JS" },
              ]}
            />
          </label>
        </div>
        <HeaderRows
          label="Response headers"
          hint="appended to the response"
          rows={content.headers ?? []}
          onChange={(rows) => updateContent({ headers: rows })}
        />
        <div className={styles.field}>
          <span className={styles.fieldLabel}>
            Content
            <span className={styles.hint}>
              {" "}
              · {content.type === ResponseType.JSON ? "JSON body" : "plain text"}
            </span>
          </span>
          <div className={styles.editorWrap}>
            <Editor
              height="220px"
              theme={LIVEMOCK_DARK_THEME}
              beforeMount={defineLivemockDarkTheme}
              language={
                content.type === ResponseType.JSON ? "json" : "plaintext"
              }
              value={content.value}
              onChange={(value) => updateContent({ value: value ?? "" })}
              options={{
                minimap: { enabled: false },
                scrollBeyondLastLine: false,
                fontSize: 13,
                wordWrap: "on",
                lineNumbersMinChars: 3,
              }}
            />
          </div>
        </div>
      </div>
    );
  } else if (draft.type === ActionType.PROXY) {
    const proxy = draft as ProxyActionM;
    const updateProxy = (patch: Partial<ProxyActionM>) =>
      setDraft((prev) => ({ ...(prev as ProxyActionM), ...patch }));
    body = (
      <div className={styles.form}>
        <div className={styles.fields}>
          <label className={[styles.field, styles.fieldFull].join(" ")}>
            <span className={styles.fieldLabel}>Host</span>
            <div className={styles.hostGroup}>
              <Input
                addonBefore={
                  <AntSelect
                    variant="borderless"
                    value={proxy.protocol}
                    onChange={(value) =>
                      updateProxy({ protocol: value as ProxyProtocol })
                    }
                    options={[
                      { value: ProxyProtocol.HTTP, label: "http://" },
                      { value: ProxyProtocol.HTTPS, label: "https://" },
                    ]}
                  />
                }
                value={proxy.host}
                placeholder="api.example.com"
                onChange={(event) => {
                  let value = event.target.value;
                  let protocol = proxy.protocol;
                  if (value.startsWith("http://")) {
                    protocol = ProxyProtocol.HTTP;
                    value = value.substring(7);
                  } else if (value.startsWith("https://")) {
                    protocol = ProxyProtocol.HTTPS;
                    value = value.substring(8);
                  }
                  updateProxy({ host: value, protocol });
                }}
              />
            </div>
          </label>
          <label className={[styles.field, styles.fieldFull].join(" ")}>
            <span className={styles.fieldLabel}>
              Prefix remove<span className={styles.hint}> · e.g. /api</span>
            </span>
            <input
              className={styles.input}
              value={proxy.prefixRemove ?? ""}
              placeholder="/api"
              onChange={(event) =>
                updateProxy({ prefixRemove: event.target.value })
              }
            />
          </label>
        </div>
        <HeaderRows
          label="Request headers"
          hint="appended to the outgoing request"
          rows={proxy.requestHeaders ?? []}
          onChange={(rows) => updateProxy({ requestHeaders: rows })}
        />
        <HeaderRows
          label="Response headers"
          hint="appended to the response"
          rows={proxy.headers ?? []}
          onChange={(rows) => updateProxy({ headers: rows })}
        />
        <div className={styles.field}>
          <span className={styles.fieldLabel}>Cross config</span>
          <div className={styles.crossRow}>
            <span className={styles.toggleRow}>
              <Toggle
                checked={proxy.handleCross}
                onChange={(value) => updateProxy({ handleCross: value })}
                label="Handle cross"
              />
              <span className={styles.toggleLabel}>Handle cross</span>
            </span>
            <span className={styles.toggleRow}>
              <Toggle
                checked={proxy.crossAllowCredentials}
                onChange={(value) =>
                  updateProxy({ crossAllowCredentials: value })
                }
                label="Allow credentials"
              />
              <span className={styles.toggleLabel}>Allow credentials</span>
            </span>
          </div>
        </div>
        <div className={styles.field}>
          <span className={styles.fieldLabel}>Websocket</span>
          <span className={styles.toggleRow}>
            <Toggle
              checked={proxy.supportWebsocket}
              onChange={(value) => updateProxy({ supportWebsocket: value })}
              label="Support websocket"
            />
            <span className={styles.toggleLabel}>Support websocket</span>
          </span>
        </div>
      </div>
    );
  } else {
    const staticAction = draft as StaticDirectoryActionM;
    const updateStatic = (patch: Partial<StaticDirectoryActionM>) =>
      setDraft((prev) => ({ ...(prev as StaticDirectoryActionM), ...patch }));
    body = (
      <div className={styles.form}>
        <div className={styles.fields}>
          <label className={[styles.field, styles.fieldFull].join(" ")}>
            <span className={styles.fieldLabel}>Folder path</span>
            <input
              className={styles.input}
              value={staticAction.folderPath}
              placeholder="/home/user/dist"
              onChange={(event) =>
                updateStatic({ folderPath: event.target.value })
              }
            />
          </label>
          <label className={styles.field}>
            <span className={styles.fieldLabel}>
              URL prefix
              <span className={styles.hint}>
                {" "}
                · leave empty to serve paths as-is
              </span>
            </span>
            <input
              className={styles.input}
              value={staticAction.urlPrefix}
              placeholder="/static"
              onChange={(event) =>
                updateStatic({ urlPrefix: event.target.value })
              }
            />
          </label>
        </div>
        <div className={styles.hint}>
          Requests under this prefix are served from the folder; the rest of the
          path is preserved.
        </div>
      </div>
    );
  }

  return (
    <Modal
      title="Edit action"
      onClose={onClose}
      size="md"
      headerExtra={headerExtra}
      footer={
        <>
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
            onClick={() => onSave(draft)}
            disabled={saving}
          >
            {saving ? "Saving…" : "Save action"}
          </button>
        </>
      }
    >
      <div ref={bodyRef}>{body}</div>
    </Modal>
  );
};

export default ActionEditorModal;
