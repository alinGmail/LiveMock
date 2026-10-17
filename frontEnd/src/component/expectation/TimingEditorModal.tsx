import { useEffect, useRef, useState } from "react";
import { ExpectationM } from "livemock-core/struct/expectation";
import { ExpectationGroupM } from "livemock-core/struct/expectationGroup";
import Modal from "../Modal";
import Select from "../Select";
import Toggle from "../Toggle";
import btn from "../buttonStyles.module.scss";
import styles from "./TimingEditorModal.module.scss";

export interface TimingValues {
  delay: number;
  priority: number;
  groupId: string | null;
  activate: boolean;
}

interface TimingEditorModalProps {
  expectation: ExpectationM;
  groups: Array<ExpectationGroupM>;
  saving: boolean;
  onSave: (values: TimingValues) => void;
  onClose: () => void;
}

const toNumber = (value: string): number => Math.max(0, Number(value) || 0);

const TimingEditorModal = ({
  expectation,
  groups,
  saving,
  onSave,
  onClose,
}: TimingEditorModalProps) => {
  const [delay, setDelay] = useState(String(expectation.delay));
  const [priority, setPriority] = useState(String(expectation.priority));
  const [groupId, setGroupId] = useState(expectation.groupId ?? "");
  const [activate, setActivate] = useState(expectation.activate);
  const delayRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    delayRef.current?.focus();
  }, []);

  const submit = () => {
    if (saving) {
      return;
    }
    onSave({
      delay: toNumber(delay),
      priority: toNumber(priority),
      groupId: groupId || null,
      activate,
    });
  };

  return (
    <Modal
      title="Edit timing & state"
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
            disabled={saving}
          >
            {saving ? "Saving…" : "Save"}
          </button>
        </>
      }
    >
      <div className={styles.form}>
        <div className={styles.fields}>
          <label className={styles.field}>
            <span className={styles.fieldLabel}>Delay (ms)</span>
            <input
              ref={delayRef}
              className={styles.input}
              type="number"
              min={0}
              value={delay}
              onChange={(event) => setDelay(event.target.value)}
            />
          </label>
          <label className={styles.field}>
            <span className={styles.fieldLabel}>Priority</span>
            <input
              className={styles.input}
              type="number"
              min={0}
              value={priority}
              onChange={(event) => setPriority(event.target.value)}
            />
          </label>
          <label className={[styles.field, styles.fieldFull].join(" ")}>
            <span className={styles.fieldLabel}>Group</span>
            <Select
              value={groupId}
              placeholder="ungrouped"
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
          <div className={styles.field}>
            <span className={styles.fieldLabel}>Active</span>
            <span className={styles.switchRow}>
              <Toggle
                checked={activate}
                onChange={setActivate}
                label="Active"
              />
              <span className={styles.switchLabel}>
                {activate ? "enabled" : "disabled"}
              </span>
            </span>
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default TimingEditorModal;
