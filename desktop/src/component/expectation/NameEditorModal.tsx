import { useEffect, useRef, useState } from "react";
import Modal from "../Modal";
import btn from "../buttonStyles.module.scss";
import styles from "./NameEditorModal.module.scss";

interface NameEditorModalProps {
  name: string;
  saving: boolean;
  onSave: (name: string) => void;
  onClose: () => void;
}

const NameEditorModal = ({
  name,
  saving,
  onSave,
  onClose,
}: NameEditorModalProps) => {
  const [value, setName] = useState(name);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
    inputRef.current?.select();
  }, []);

  const trimmed = value.trim();

  return (
    <Modal
      title="Edit name"
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
            onClick={() => onSave(trimmed)}
            disabled={saving || !trimmed}
          >
            {saving ? "Saving…" : "Save"}
          </button>
        </>
      }
    >
      <div className={styles.form}>
        <label className={styles.field}>
          <span className={styles.fieldLabel}>Name</span>
          <input
            ref={inputRef}
            className={styles.input}
            value={value}
            placeholder="Expectation name"
            onChange={(event) => setName(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !saving && trimmed) {
                onSave(trimmed);
              }
            }}
          />
        </label>
      </div>
    </Modal>
  );
};

export default NameEditorModal;
