import { useEffect, useRef, useState } from "react";
import { ExpectationGroupM } from "livemock-core/struct/expectationGroup";
import Modal from "../Modal";
import Toggle from "../Toggle";
import btn from "../buttonStyles.module.scss";
import styles from "./GroupEditorModal.module.scss";

export interface GroupEditorValues {
  name: string;
  priority: number;
  activate: boolean;
}

interface GroupEditorModalProps {
  mode: "create" | "edit";
  group?: ExpectationGroupM;
  defaultName: string;
  existingNames: Array<string>;
  saving: boolean;
  onSubmit: (values: GroupEditorValues) => void;
  onClose: () => void;
}

const effectiveName = (raw: string) => raw.trim() || "Untitled group";

/**
 * Create/edit an expectation group. Mirrors the redesign's group dialog: Name,
 * Priority (higher is matched first) and an Active switch. Duplicate non-empty
 * names are rejected by the API, so they are flagged here before submitting.
 */
const GroupEditorModal = ({
  mode,
  group,
  defaultName,
  existingNames,
  saving,
  onSubmit,
  onClose,
}: GroupEditorModalProps) => {
  const [name, setName] = useState(
    mode === "edit" ? group?.name ?? "" : defaultName
  );
  const [priority, setPriority] = useState(
    mode === "edit" ? String(group?.priority ?? 0) : "0"
  );
  const [activate, setActivate] = useState(
    mode === "edit" ? !!group?.activate : true
  );
  const nameRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    nameRef.current?.focus();
  }, []);

  const duplicate = existingNames.includes(effectiveName(name));
  const parsedPriority = (() => {
    const value = parseInt(priority, 10);
    return Number.isFinite(value) ? value : 0;
  })();

  const submit = () => {
    if (saving || duplicate) {
      return;
    }
    onSubmit({ name: effectiveName(name), priority: parsedPriority, activate });
  };

  return (
    <Modal
      title={mode === "edit" ? "Edit group" : "Add group"}
      onClose={onClose}
      size="sm"
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
            onClick={submit}
            disabled={saving || duplicate}
          >
            {saving ? "Saving…" : mode === "edit" ? "Save" : "Create"}
          </button>
        </>
      }
    >
      <div className={styles.form}>
        <label className={styles.field}>
          <span className={styles.fieldLabel}>Name</span>
          <input
            ref={nameRef}
            className={styles.input}
            value={name}
            placeholder="Group name"
            onChange={(event) => setName(event.target.value)}
          />
          {duplicate ? (
            <span className={styles.error}>
              A group with this name already exists.
            </span>
          ) : null}
        </label>

        <label className={styles.field}>
          <span className={styles.fieldLabel}>
            Priority<span className={styles.hint}> · higher is matched first</span>
          </span>
          <input
            className={[styles.input, styles.mono].join(" ")}
            inputMode="numeric"
            value={priority}
            onChange={(event) => setPriority(event.target.value)}
          />
        </label>

        <div className={styles.field}>
          <span className={styles.fieldLabel}>Active</span>
          <span className={styles.switchRow}>
            <Toggle checked={activate} onChange={setActivate} label="Active" />
            <span className={styles.switchLabel}>
              {activate ? "enabled" : "disabled"}
            </span>
          </span>
        </div>
      </div>
    </Modal>
  );
};

export default GroupEditorModal;
