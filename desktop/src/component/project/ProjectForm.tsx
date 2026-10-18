import { FormEvent, useState } from "react";
import { ProjectM } from "livemock-core/struct/project";
import btn from "../buttonStyles.module.scss";
import styles from "./ProjectForm.module.scss";

export interface ProjectFormValues {
  name: string;
  port: string;
  maxRequestLogNumber: number;
  description: string;
}

interface ProjectFormProps {
  initial?: Partial<ProjectM>;
  submitting: boolean;
  submitLabel?: string;
  onSubmit: (values: ProjectFormValues) => void;
}

interface FormErrors {
  name?: string;
  port?: string;
  maxLog?: string;
}

/**
 * New-UI project form shared by the Welcome/first-run page and the dashboard's
 * "New project" dialog. Mirrors the redesign's fields and validation.
 */
const ProjectForm = ({
  initial,
  submitting,
  submitLabel = "Create project",
  onSubmit,
}: ProjectFormProps) => {
  const [name, setName] = useState(initial?.name ?? "");
  const [port, setPort] = useState(initial?.port ?? "8088");
  const [maxLog, setMaxLog] = useState(
    String(initial?.maxRequestLogNumber ?? 5000)
  );
  const [description, setDescription] = useState(initial?.description ?? "");
  const [errors, setErrors] = useState<FormErrors>({});

  const validate = (): ProjectFormValues | null => {
    const next: FormErrors = {};
    const trimmedName = name.trim();
    if (!trimmedName) {
      next.name = "Please input a project name";
    }
    const portNumber = Number(port);
    if (
      !port.trim() ||
      !Number.isInteger(portNumber) ||
      portNumber < 1 ||
      portNumber > 65535
    ) {
      next.port = "Port must be 1–65535";
    }
    const maxNumber = Number(maxLog);
    if (!maxLog.trim() || !Number.isFinite(maxNumber) || maxNumber < 1000) {
      next.maxLog = "Minimum 1000";
    }
    setErrors(next);
    if (Object.keys(next).length > 0) {
      return null;
    }
    return {
      name: trimmedName,
      port: String(portNumber),
      maxRequestLogNumber: Math.max(1000, Math.floor(maxNumber)),
      description: description.trim(),
    };
  };

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (submitting) {
      return;
    }
    const values = validate();
    if (values) {
      onSubmit(values);
    }
  };

  return (
    <form className={styles.form} onSubmit={submit} noValidate>
      <div className={styles.fields}>
        <label className={[styles.field, styles.span2].join(" ")}>
          <span className={styles.label}>Project name</span>
          <input
            className={styles.input}
            value={name}
            placeholder="e.g. checkout API"
            autoComplete="off"
            onChange={(event) => {
              setName(event.target.value);
              setErrors((prev) => ({ ...prev, name: undefined }));
            }}
          />
          {errors.name ? (
            <span className={styles.error}>{errors.name}</span>
          ) : null}
        </label>

        <label className={styles.field}>
          <span className={styles.label}>Port</span>
          <input
            className={[styles.input, styles.mono].join(" ")}
            value={port}
            inputMode="numeric"
            onChange={(event) => {
              setPort(event.target.value);
              setErrors((prev) => ({ ...prev, port: undefined }));
            }}
          />
          {errors.port ? (
            <span className={styles.error}>{errors.port}</span>
          ) : null}
        </label>

        <label className={styles.field}>
          <span className={styles.label}>
            Max request log<span className={styles.hint}> · min 1000</span>
          </span>
          <input
            className={[styles.input, styles.mono].join(" ")}
            value={maxLog}
            inputMode="numeric"
            onChange={(event) => {
              setMaxLog(event.target.value);
              setErrors((prev) => ({ ...prev, maxLog: undefined }));
            }}
          />
          {errors.maxLog ? (
            <span className={styles.error}>{errors.maxLog}</span>
          ) : null}
        </label>

        <label className={[styles.field, styles.span2].join(" ")}>
          <span className={styles.label}>Description</span>
          <textarea
            className={styles.textarea}
            rows={3}
            value={description}
            placeholder="What is this project for?"
            onChange={(event) => setDescription(event.target.value)}
          />
        </label>
      </div>

      <div className={styles.actions}>
        <button
          type="submit"
          className={[btn.btn, btn.primary].join(" ")}
          disabled={submitting}
        >
          {submitting ? "Creating…" : submitLabel}
        </button>
      </div>
    </form>
  );
};

export default ProjectForm;
