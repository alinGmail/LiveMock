import { useEffect, useRef, useState } from "react";
import { ExpectationGroupM } from "livemock-core/struct/expectationGroup";
import Modal from "../Modal";
import Select from "../Select";
import btn from "../buttonStyles.module.scss";
import styles from "./AddExpectationModal.module.scss";

export interface AddExpectationValues {
  name: string;
  description: string;
  groupId: string | null;
}

interface AddExpectationModalProps {
  groups: Array<ExpectationGroupM>;
  /** When set, the expectation is created in this group and the group is fixed. */
  lockedGroupId?: string | null;
  /** Prefills the form (used when cloning an existing expectation). */
  initialValues?: AddExpectationValues;
  title?: string;
  submitLabel?: string;
  submittingLabel?: string;
  creating: boolean;
  onCreate: (values: AddExpectationValues) => void;
  onClose: () => void;
}

const AddExpectationModal = ({
  groups,
  lockedGroupId,
  initialValues,
  title = "Add expectation",
  submitLabel = "Create",
  submittingLabel = "Creating…",
  creating,
  onCreate,
  onClose,
}: AddExpectationModalProps) => {
  const [name, setName] = useState(initialValues?.name ?? "");
  const [description, setDescription] = useState(
    initialValues?.description ?? "",
  );
  const [groupId, setGroupId] = useState(
    lockedGroupId ?? initialValues?.groupId ?? "",
  );
  const nameRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    nameRef.current?.focus();
    if (initialValues?.name) {
      nameRef.current?.select();
    }
  }, [initialValues?.name]);

  const submit = () => {
    if (creating) {
      return;
    }
    onCreate({ name, description, groupId: groupId || null });
  };

  return (
    <Modal
      title={title}
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
            disabled={creating}
          >
            {creating ? submittingLabel : submitLabel}
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
          <Select
            value={groupId}
            placeholder="ungrouped"
            disabled={Boolean(lockedGroupId)}
            onChange={(value) => setGroupId(value ?? "")}
            options={[
              { value: "", label: "ungrouped" },
              ...groups.map((group) => ({
                value: group.id,
                label: group.name || "unnamed group",
              })),
            ]}
          />
        </label>
      </div>
    </Modal>
  );
};

export default AddExpectationModal;
