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
  deleting: boolean;
  onSubmit: (values: ProjectSettingsValues) => void;
  onDelete: () => void;
  onClose: () => void;
}

/**
 * Project-level settings dialog, opened from the app bar's gear. Mirrors the
 * redesign's Project settings modal: name, port, max request log and
 * description with an explicit Save changes, plus a Danger zone that opens a
 * type-the-name delete confirmation. The port can only be changed while the
 * project is stopped; deletion is likewise only offered while stopped.
 */
const ProjectSettingsModal = ({
  project,
  saving,
  deleting,
  onSubmit,
  onDelete,
  onClose,
}: ProjectSettingsModalProps) => {
  const [name, setName] = useState(project.name);
  const [port, setPort] = useState(project.port);
  const [maxLog, setMaxLog] = useState(
    String(project.maxRequestLogNumber ?? DEFAULT_MAX_REQUEST_LOG_NUMBER)
  );
  const [description, setDescription] = useState(project.description ?? "");
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [deleteName, setDeleteName] = useState("");
  const [deleteError, setDeleteError] = useState("");
  const nameRef = useRef<HTMLInputElement>(null);
  const deleteNameRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    nameRef.current?.focus();
  }, []);

  useEffect(() => {
    if (confirmingDelete) {
      deleteNameRef.current?.focus();
    }
  }, [confirmingDelete]);

  const portLocked = project.status !== ProjectStatus.STOPPED;
  const deleteLocked = project.status !== ProjectStatus.STOPPED;
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

  const confirmDelete = () => {
    if (deleting) {
      return;
    }
    if (deleteName.trim() !== project.name) {
      setDeleteError("incorrect project name");
      deleteNameRef.current?.focus();
      return;
    }
    onDelete();
  };

  if (confirmingDelete) {
    return (
      <Modal
        title="Delete project"
        onClose={() => setConfirmingDelete(false)}
        size="sm"
        footer={
          <>
            <button
              type="button"
              className={[btn.btn, btn.ghost].join(" ")}
              onClick={() => setConfirmingDelete(false)}
            >
              Cancel
            </button>
            <button
              type="button"
              className={[btn.btn, btn.dangerSolid].join(" ")}
              onClick={confirmDelete}
              disabled={deleting}
            >
              {deleting ? "Deleting…" : "Delete project"}
            </button>
          </>
        }
      >
        <div className={styles.form}>
          <p className={styles.dangerText}>
            Are you sure you want to delete <b>{project.name}</b>? This
            permanently removes the project and all of its mock data.
          </p>
          <label className={styles.field}>
            <span className={styles.fieldLabel}>
              Type the project name to confirm
            </span>
            <input
              ref={deleteNameRef}
              className={[styles.input, styles.mono].join(" ")}
              value={deleteName}
              placeholder={project.name}
              autoComplete="off"
              onChange={(event) => {
                setDeleteName(event.target.value);
                setDeleteError("");
              }}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  confirmDelete();
                }
              }}
            />
            {deleteError ? (
              <span className={styles.error}>{deleteError}</span>
            ) : null}
          </label>
        </div>
      </Modal>
    );
  }

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

        <div className={styles.dangerZone}>
          <div>
            <div className={styles.dangerTitle}>Delete project</div>
            <div className={styles.dangerDesc}>
              Permanently delete this project and all of its mock data.
            </div>
            {deleteLocked ? (
              <div className={styles.dangerHint}>
                Stop the project before deleting.
              </div>
            ) : null}
          </div>
          <button
            type="button"
            className={[btn.btn, btn.dangerOutline].join(" ")}
            onClick={() => setConfirmingDelete(true)}
            disabled={deleteLocked}
          >
            Delete project
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default ProjectSettingsModal;
