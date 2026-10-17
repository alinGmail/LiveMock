import { useEffect, useRef, useState } from "react";
import Modal from "../Modal";
import btn from "../buttonStyles.module.scss";
import styles from "./DescriptionEditorModal.module.scss";

interface DescriptionEditorModalProps {
  description: string;
  saving: boolean;
  onSave: (description: string) => void;
  onClose: () => void;
}

const DescriptionEditorModal = ({
  description,
  saving,
  onSave,
  onClose,
}: DescriptionEditorModalProps) => {
  const [value, setValue] = useState(description);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  return (
    <Modal
      title="Edit description"
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
            onClick={() => onSave(value)}
            disabled={saving}
          >
            {saving ? "Saving…" : "Save"}
          </button>
        </>
      }
    >
      <div className={styles.form}>
        <label className={styles.field}>
          <span className={styles.fieldLabel}>
            Description<span className={styles.hint}> · optional</span>
          </span>
          <textarea
            ref={textareaRef}
            className={styles.textarea}
            rows={5}
            value={value}
            placeholder="What does this expectation do?"
            onChange={(event) => setValue(event.target.value)}
          />
        </label>
      </div>
    </Modal>
  );
};

export default DescriptionEditorModal;
