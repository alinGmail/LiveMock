import { KeyboardEvent, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ExpectationGroupM } from "livemock-core/struct/expectationGroup";
import styles from "./AddExpectationModal.module.scss";

export interface AddExpectationValues {
  name: string;
  description: string;
  groupId: string | null;
}

interface AddExpectationModalProps {
  groups: Array<ExpectationGroupM>;
  creating: boolean;
  onCreate: (values: AddExpectationValues) => void;
  onClose: () => void;
}

const CloseIcon = () => (
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

const AddExpectationModal = ({
  groups,
  creating,
  onCreate,
  onClose,
}: AddExpectationModalProps) => {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [groupId, setGroupId] = useState("");
  const dialogRef = useRef<HTMLDivElement>(null);
  const nameRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    nameRef.current?.focus();
  }, []);

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Escape") {
      event.stopPropagation();
      onClose();
      return;
    }
    if (event.key !== "Tab") {
      return;
    }
    const container = dialogRef.current;
    if (!container) {
      return;
    }
    const focusable = Array.from(
      container.querySelectorAll<HTMLElement>(
        'button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])',
      ),
    );
    if (focusable.length === 0) {
      return;
    }
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  };

  const submit = () => {
    if (creating) {
      return;
    }
    onCreate({ name, description, groupId: groupId || null });
  };

  return createPortal(
    <div
      className={styles.overlay}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
      onKeyDown={handleKeyDown}
    >
      <div
        ref={dialogRef}
        className={styles.modal}
        role="dialog"
        aria-modal="true"
        aria-label="Add expectation"
      >
        <div className={styles.head}>
          <h2>Add expectation</h2>
          <span className={styles.grow} />
          <button
            type="button"
            className={[styles.btn, styles.ghost, styles.iconBtn].join(" ")}
            aria-label="Close"
            onClick={onClose}
          >
            <CloseIcon />
          </button>
        </div>
        <div className={styles.body}>
          <label className={styles.field}>
            <span className={styles.fieldLabel}>Name</span>
            <input
              ref={nameRef}
              className={styles.input}
              value={name}
              placeholder="e.g. login success"
              onChange={(event) => setName(event.target.value)}
            />
          </label>
          <label className={styles.field}>
            <span className={styles.fieldLabel}>
              Description<span className={styles.hint}> · optional</span>
            </span>
            <textarea
              className={styles.textarea}
              rows={2}
              value={description}
              placeholder="What does this expectation do?"
              onChange={(event) => setDescription(event.target.value)}
            />
          </label>
          <label className={styles.field}>
            <span className={styles.fieldLabel}>Group</span>
            <select
              className={[styles.input, styles.select].join(" ")}
              value={groupId}
              onChange={(event) => setGroupId(event.target.value)}
            >
              <option value="">ungrouped</option>
              {groups.map((group) => (
                <option key={group.id} value={group.id}>
                  {group.name || "unnamed group"}
                </option>
              ))}
            </select>
          </label>
        </div>
        <div className={styles.foot}>
          <button
            type="button"
            className={[styles.btn, styles.ghost].join(" ")}
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            type="button"
            className={[styles.btn, styles.primary].join(" ")}
            onClick={submit}
            disabled={creating}
          >
            {creating ? "Creating…" : "Create"}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
};

export default AddExpectationModal;
