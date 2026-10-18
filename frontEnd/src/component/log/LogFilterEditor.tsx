import {
  KeyboardEvent,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import {
  LogFilterCondition,
  LogFilterConditionMap,
  SimpleFilterM,
} from "livemock-core/struct/log";
import Select from "../Select";
import Toggle from "../Toggle";
import btn from "../buttonStyles.module.scss";
import styles from "./LogFilterEditor.module.scss";

const CONDITIONS = [
  LogFilterCondition.EQUAL,
  LogFilterCondition.NOT_EQUAL,
  LogFilterCondition.CONTAINS,
  LogFilterCondition.GREATER,
  LogFilterCondition.LESS,
  LogFilterCondition.IN,
];

const PROPERTY_SUGGESTIONS = [
  "req.method",
  "req.path",
  "req.headers.user-agent",
  "req.query.",
  "req.body.",
  "res.status",
  "res.body.",
];

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

const TagInput = ({
  values,
  onChange,
  placeholder,
}: {
  values: Array<string>;
  onChange: (values: Array<string>) => void;
  placeholder: string;
}) => {
  const [text, setText] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const addText = () => {
    const parts = text
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
    if (parts.length) {
      const next = [...values];
      parts.forEach((part) => {
        if (!next.includes(part)) {
          next.push(part);
        }
      });
      onChange(next);
    }
    setText("");
  };

  return (
    <div className={styles.tagInput} onClick={() => inputRef.current?.focus()}>
      {values.map((item) => (
        <span key={item} className={styles.tag}>
          {item}
          <button
            type="button"
            className={styles.tagRemove}
            aria-label={`Remove ${item}`}
            onClick={(event) => {
              event.stopPropagation();
              onChange(values.filter((value) => value !== item));
            }}
          >
            <XIcon />
          </button>
        </span>
      ))}
      <input
        ref={inputRef}
        className={styles.tagField}
        value={text}
        placeholder={values.length ? "" : placeholder}
        onChange={(event) => setText(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === ",") {
            event.preventDefault();
            addText();
          } else if (event.key === "Backspace" && !text && values.length) {
            event.preventDefault();
            onChange(values.slice(0, -1));
          }
        }}
        onBlur={addText}
      />
    </div>
  );
};

interface LogFilterEditorProps {
  mode: "create" | "edit";
  filter: SimpleFilterM;
  anchor: HTMLElement;
  saving: boolean;
  onSave: (filter: SimpleFilterM) => void;
  onDelete?: () => void;
  onClose: () => void;
}

const initialValue = (filter: SimpleFilterM): string => {
  if (filter.condition === LogFilterCondition.IN) {
    return "";
  }
  return Array.isArray(filter.value) ? filter.value.join(", ") : filter.value;
};

const initialValues = (filter: SimpleFilterM): Array<string> => {
  if (filter.condition !== LogFilterCondition.IN) {
    return [];
  }
  return Array.isArray(filter.value) ? [...filter.value] : [];
};

const LogFilterEditor = ({
  mode,
  filter,
  anchor,
  saving,
  onSave,
  onDelete,
  onClose,
}: LogFilterEditorProps) => {
  const [property, setProperty] = useState(filter.property);
  const [condition, setCondition] = useState(filter.condition);
  const [value, setValue] = useState(() => initialValue(filter));
  const [values, setValues] = useState<Array<string>>(() => initialValues(filter));
  const [activate, setActivate] = useState(filter.activate !== false);
  const [position, setPosition] = useState({ top: 0, left: 0, ready: false });
  const panelRef = useRef<HTMLDivElement>(null);
  const propertyRef = useRef<HTMLInputElement>(null);
  const onCloseRef = useRef(onClose);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  const updatePosition = () => {
    const rect = anchor.getBoundingClientRect();
    const panel = panelRef.current;
    const width = panel?.offsetWidth ?? 348;
    const height = panel?.offsetHeight ?? 330;
    const margin = 12;
    const gap = 8;
    let top = rect.bottom + gap;
    if (top + height > window.innerHeight - margin) {
      top = Math.max(margin, rect.top - height - gap);
    }
    const left = Math.max(
      margin,
      Math.min(rect.left, window.innerWidth - width - margin),
    );
    setPosition({ top, left, ready: true });
  };

  useLayoutEffect(() => {
    updatePosition();
    const frame = window.requestAnimationFrame(updatePosition);
    return () => window.cancelAnimationFrame(frame);
  }, [anchor]);

  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    propertyRef.current?.focus();
    propertyRef.current?.select();

    const onPointerDown = (event: MouseEvent) => {
      const target = event.target as Node;
      // antd renders Select popups in their own body portal, outside panelRef.
      if ((event.target as Element | null)?.closest?.(".ant-select-dropdown")) {
        return;
      }
      if (panelRef.current?.contains(target) || anchor.contains(target)) {
        return;
      }
      onCloseRef.current();
    };
    const onKeyDown = (event: globalThis.KeyboardEvent) => {
      if (event.key === "Escape") {
        event.stopPropagation();
        onCloseRef.current();
      }
    };
    const onViewportChange = () => updatePosition();

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    window.addEventListener("resize", onViewportChange);
    window.addEventListener("scroll", onViewportChange, true);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("resize", onViewportChange);
      window.removeEventListener("scroll", onViewportChange, true);
      previous?.focus?.();
    };
  }, [anchor]);

  const changeCondition = (next: LogFilterCondition) => {
    if (next === condition) {
      return;
    }
    if (next === LogFilterCondition.IN) {
      setValues(
        value
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean),
      );
      setValue("");
    } else if (condition === LogFilterCondition.IN) {
      setValue(values.join(", "));
    }
    setCondition(next);
  };

  const trimmedProperty = property.trim();
  const validValue =
    condition === LogFilterCondition.IN ? values.length > 0 : !!value.trim();
  const valid = !!trimmedProperty && validValue;

  const submit = () => {
    if (!valid || saving) {
      return;
    }
    onSave({
      ...filter,
      property: trimmedProperty,
      condition,
      value:
        condition === LogFilterCondition.IN ? [...values] : value.trim(),
      activate,
    });
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Escape") {
      event.stopPropagation();
      onClose();
    }
  };

  const title = mode === "create" ? "Add filter" : "Edit filter";
  const conditionOptions = CONDITIONS.map((item) => ({
    value: item,
    label: `${LogFilterConditionMap[item]} (${item})`,
  }));

  return createPortal(
    <div
      ref={panelRef}
      className={styles.popover}
      style={{
        top: position.top,
        left: position.left,
        visibility: position.ready ? "visible" : "hidden",
      }}
      role="dialog"
      aria-label={title}
      onKeyDown={handleKeyDown}
    >
      <div className={styles.head}>
        <span>{title}</span>
        <span className={styles.grow} />
        <button
          type="button"
          className={[btn.btn, btn.ghost, btn.iconBtn].join(" ")}
          aria-label="Close filter editor"
          onClick={onClose}
        >
          <XIcon />
        </button>
      </div>

      <div className={styles.body}>
        <label className={styles.field}>
          <span className={styles.fieldLabel}>
            Property
            <span className={styles.hint}> · JSON path in the log</span>
          </span>
          <input
            ref={propertyRef}
            className={[styles.input, styles.mono].join(" ")}
            list="logProps"
            value={property}
            placeholder="req.path"
            onChange={(event) => setProperty(event.target.value)}
          />
          <datalist id="logProps">
            {PROPERTY_SUGGESTIONS.map((item) => (
              <option key={item} value={item} />
            ))}
          </datalist>
        </label>

        <label className={styles.field}>
          <span className={styles.fieldLabel}>Condition</span>
          <Select
            value={condition}
            onChange={(next) => changeCondition(next as LogFilterCondition)}
            options={conditionOptions}
          />
        </label>

        {condition === LogFilterCondition.IN ? (
          <label className={styles.field}>
            <span className={styles.fieldLabel}>
              Value<span className={styles.hint}> · one tag per value</span>
            </span>
            <TagInput
              values={values}
              onChange={setValues}
              placeholder="type a value and press Enter"
            />
          </label>
        ) : (
          <label className={styles.field}>
            <span className={styles.fieldLabel}>Value</span>
            <input
              className={[styles.input, styles.mono].join(" ")}
              value={value}
              placeholder="value"
              onChange={(event) => setValue(event.target.value)}
            />
          </label>
        )}

        <div className={styles.activeRow}>
          <span className={styles.fieldLabel}>Active</span>
          <Toggle
            checked={activate}
            onChange={setActivate}
            label="Filter active"
          />
        </div>
      </div>

      <div className={styles.foot}>
        {mode === "edit" && onDelete ? (
          <button
            type="button"
            className={[btn.btn, btn.ghost, styles.delete].join(" ")}
            onClick={onDelete}
            disabled={saving}
          >
            Delete
          </button>
        ) : null}
        <span className={styles.grow} />
        <button
          type="button"
          className={[btn.btn, btn.ghost].join(" ")}
          onClick={onClose}
          disabled={saving}
        >
          Cancel
        </button>
        <button
          type="button"
          className={[btn.btn, btn.primary].join(" ")}
          onClick={submit}
          disabled={!valid || saving}
        >
          {saving ? "Saving…" : mode === "create" ? "Add filter" : "Done"}
        </button>
      </div>
    </div>,
    document.body,
  );
};

export default LogFilterEditor;
