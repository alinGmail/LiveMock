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

const Toggle = ({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (value: boolean) => void;
  label: string;
}) => (
  <span
    className={[styles.switch, checked ? styles.switchOn : ""].join(" ")}
    role="switch"
    aria-checked={checked}
    aria-label={label}
    tabIndex={0}
    onClick={() => onChange(!checked)}
    onKeyDown={(event) => {
      if (event.key === " " || event.key === "Enter") {
        event.preventDefault();
        onChange(!checked);
      }
    }}
  >
    <span className={styles.switchKnob} />
  </span>
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
            <select
              className={[styles.input, styles.select].join(" ")}
              value={content.type}
              onChange={(event) =>
                updateContent({ type: event.target.value as ResponseType })
              }
            >
              <option value={ResponseType.JSON}>JSON</option>
              <option value={ResponseType.TEXT}>TEXT</option>
            </select>
          </label>
          <label className={styles.field}>
            <span className={styles.fieldLabel}>Content handler</span>
            <select
              className={[styles.input, styles.select].join(" ")}
              value={content.contentHandler ?? ContentHandler.NONE}
              onChange={(event) =>
                updateContent({
                  contentHandler: event.target.value as ContentHandler,
                })
              }
            >
              <option value={ContentHandler.NONE}>NONE</option>
              <option value={ContentHandler.MOCK_JS}>MOCK_JS</option>
            </select>
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
              theme="livemock-dark"
              beforeMount={(monaco) => {
                monaco.editor.defineTheme("livemock-dark", {
                  base: "vs-dark",
                  inherit: true,
                  rules: [],
                  colors: {
                    "editor.background": "#0b1220",
                    "editorGutter.background": "#0b1220",
                    "editorLineNumber.foreground": "#64748b",
                    "editorLineNumber.activeForeground": "#94a3b8",
                    "editor.lineHighlightBackground": "#16223a",
                    "editorCursor.foreground": "#60a5fa",
                    "editor.selectionBackground": "#3b82f655",
                    "editorWidget.background": "#1e293b",
                    "editorWidget.border": "#26364d",
                    "minimap.background": "#0b1220",
                    "scrollbarSlider.background": "#2a3b5280",
                    "scrollbarSlider.hoverBackground": "#3b4f6b99",
                    "scrollbarSlider.activeBackground": "#3b4f6bcc",
                  },
                });
              }}
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
          <label className={styles.field}>
            <span className={styles.fieldLabel}>Protocol</span>
            <select
              className={[styles.input, styles.select].join(" ")}
              value={proxy.protocol}
              onChange={(event) =>
                updateProxy({ protocol: event.target.value as ProxyProtocol })
              }
            >
              <option value={ProxyProtocol.HTTP}>http://</option>
              <option value={ProxyProtocol.HTTPS}>https://</option>
            </select>
          </label>
          <label className={styles.field}>
            <span className={styles.fieldLabel}>Host</span>
            <input
              className={styles.input}
              value={proxy.host}
              placeholder="api.example.com"
              onChange={(event) => updateProxy({ host: event.target.value })}
            />
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
