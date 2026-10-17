import { useEffect, useRef, useState } from "react";
import {
  DEFAULT_MAX_REQUEST_LOG_NUMBER,
  MIN_MAX_REQUEST_LOG_NUMBER,
  ProjectM,
  ProjectStatus,
} from "livemock-core/struct/project";
import Modal from "./Modal";
import btn from "./buttonStyles.module.scss";
import styles from "./ProjectSettingsModal.module.scss";

export interface ProjectSettingsValues {
  name: string;
  port: string;
  maxRequestLogNumber: number;
  description: string;
}

interface ProjectSettingsModalProps {
  project: ProjectM;
  saving: boolean;
  onSubmit: (values: ProjectSettingsValues) => void;
  onClose: () => void;
}

/**
 * Project-level settings dialog, opened from the app bar's gear. Mirrors the
 * redesign's Project settings modal: name, port, max request log and
 * description with an explicit Save changes. The port can only be changed while
 * the project is stopped; the other fields save at any time.
 */
const ProjectSettingsModal = ({
  project,
  saving,
  onSubmit,
  onClose,
}: ProjectSettingsModalProps) => {
  const [name, setName] = useState(project.name);
  const [port, setPort] = useState(project.port);
  const [maxLog, setMaxLog] = useState(
    String(project.maxRequestLogNumber ?? DEFAULT_MAX_REQUEST_LOG_NUMBER)
  );
  const [description, setDescription] = useState(project.description ?? "");
  const nameRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    nameRef.current?.focus();
  }, []);

  const portLocked = project.status !== ProjectStatus.STOPPED;
  const portValue = port.trim() || "8088";
  const portValid = /^\d+$/.test(portValue);
  const maxLogValue = Math.max(
    MIN_MAX_REQUEST_LOG_NUMBER,
    parseInt(maxLog, 10) || DEFAULT_MAX_REQUEST_LOG_NUMBER
  );

  const submit = () => {
    if (saving || !portValid) {
      return;
    }
    onSubmit({
      name: name.trim() || "Untitled project",
      port: portValue,
      maxRequestLogNumber: maxLogValue,
      description,
    });
  };

  return (
    <Modal
      title="Project settings"
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
            disabled={saving || !portValid}
          >
            {saving ? "Saving…" : "Save changes"}
          </button>
        </>
      }
    >
      <div className={styles.form}>
        <label className={styles.field}>
          <span className={styles.fieldLabel}>Project name</span>
          <input
            ref={nameRef}
            className={styles.input}
            value={name}
            onChange={(event) => setName(event.target.value)}
          />
        </label>

        <label className={styles.field}>
          <span className={styles.fieldLabel}>Port</span>
          <input
            className={[styles.input, styles.mono].join(" ")}
            inputMode="numeric"
            value={port}
            disabled={portLocked}
            onChange={(event) => setPort(event.target.value)}
          />
          {portLocked ? (
            <span className={styles.hint}>
              Stop the project to change the port.
            </span>
          ) : !portValid ? (
            <span className={styles.error}>Port must be a number.</span>
          ) : null}
        </label>

        <label className={styles.field}>
          <span className={styles.fieldLabel}>
            Max request log
            <span className={styles.hint}> · minimum 1000, default 5000</span>
          </span>
          <input
            className={[styles.input, styles.mono].join(" ")}
            inputMode="numeric"
            value={maxLog}
            onChange={(event) => setMaxLog(event.target.value)}
          />
        </label>

        <label className={styles.field}>
          <span className={styles.fieldLabel}>Description</span>
          <textarea
            className={styles.textarea}
            rows={4}
            value={description}
            placeholder="What is this project for?"
            onChange={(event) => setDescription(event.target.value)}
          />
        </label>
      </div>
    </Modal>
  );
};

export default ProjectSettingsModal;
