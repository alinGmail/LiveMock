import { FormEvent, useState } from "react";
import { useNavigate } from "react-router-dom";
import { changePasswordReq } from "../server/authServer";
import { getErrorMessage } from "../component/common";
import { useAppSelector } from "../store";
import EyeIcon from "../component/EyeIcon";
import btn from "../component/buttonStyles.module.scss";
import styles from "./SettingsPage.module.scss";

const BackIcon = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M19 12H5M12 19l-7-7 7-7" />
  </svg>
);

interface PasswordFieldProps {
  label: string;
  value: string;
  autoComplete: string;
  show: boolean;
  error?: string;
  onChange: (value: string) => void;
  onToggle: () => void;
}

const PasswordField = ({
  label,
  value,
  autoComplete,
  show,
  error,
  onChange,
  onToggle,
}: PasswordFieldProps) => (
  <label className={styles.field}>
    <span className={styles.label}>{label}</span>
    <span className={styles.pwWrap}>
      <input
        className={styles.input}
        type={show ? "text" : "password"}
        value={value}
        autoComplete={autoComplete}
        onChange={(event) => onChange(event.target.value)}
      />
      <button
        type="button"
        className={[styles.pwEye, show ? styles.pwEyeOn : ""].join(" ")}
        aria-label={show ? "Hide password" : "Show password"}
        onClick={onToggle}
      >
        <EyeIcon off={show} />
      </button>
    </span>
    {error ? <span className={styles.error}>{error}</span> : null}
  </label>
);

const SettingsPage = () => {
  const navigate = useNavigate();
  const username = useAppSelector((state) => state.auth.username);

  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNext, setShowNext] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [errors, setErrors] = useState({
    current: "",
    next: "",
    confirm: "",
    form: "",
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (saving) {
      return;
    }
    const nextErrors = { current: "", next: "", confirm: "", form: "" };
    if (!current) {
      nextErrors.current = "Please input the current password";
    }
    if (!next) {
      nextErrors.next = "Please input the new password";
    } else if (next.length < 8) {
      nextErrors.next = "At least 8 characters";
    } else if (next.length > 64) {
      nextErrors.next = "At most 64 characters";
    }
    if (!confirm) {
      nextErrors.confirm = "Please confirm the new password";
    } else if (confirm !== next) {
      nextErrors.confirm = "Passwords do not match";
    }
    setErrors(nextErrors);
    if (nextErrors.current || nextErrors.next || nextErrors.confirm) {
      return;
    }
    setSaving(true);
    setSaved(false);
    try {
      await changePasswordReq(current, next);
      setCurrent("");
      setNext("");
      setConfirm("");
      setShowCurrent(false);
      setShowNext(false);
      setShowConfirm(false);
      setSaved(true);
      window.setTimeout(() => setSaved(false), 4000);
    } catch (error) {
      setErrors({ ...nextErrors, form: getErrorMessage(error) });
    } finally {
      setSaving(false);
    }
  };

  const initial = (username || "account").charAt(0).toUpperCase();

  return (
    <div className={styles.page}>
      <div className={styles.inner}>
        <div className={styles.head}>
          <button
            type="button"
            className={[btn.btn, btn.ghost, btn.iconBtn].join(" ")}
            aria-label="Back"
            onClick={() => navigate(-1)}
          >
            <BackIcon />
          </button>
          <div>
            <h2>Settings</h2>
            <p>Account and security for this LiveMock instance.</p>
          </div>
        </div>

        <section className={styles.card}>
          <div className={styles.cardHead}>
            <h3>Account</h3>
          </div>
          <div className={styles.cardBody}>
            <div className={styles.accountRow}>
              <span className={styles.avatarLg}>{initial}</span>
              <div>
                <div className={styles.accountName}>
                  {username || "account"}
                </div>
                <div className={styles.accountMeta}>
                  Single account · web dashboard
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className={styles.card}>
          <div className={styles.cardHead}>
            <h3>Change password</h3>
            <span className={styles.hint}>
              At least 8 characters · signs out other sessions
            </span>
          </div>
          <form
            className={[styles.cardBody, styles.form].join(" ")}
            onSubmit={submit}
            noValidate
          >
            {errors.form ? (
              <div className={styles.formError} role="alert">
                {errors.form}
              </div>
            ) : null}

            <PasswordField
              label="Current password"
              value={current}
              autoComplete="current-password"
              show={showCurrent}
              error={errors.current}
              onChange={(value) => {
                setCurrent(value);
                setErrors((prev) => ({ ...prev, current: "" }));
              }}
              onToggle={() => setShowCurrent((prev) => !prev)}
            />
            <PasswordField
              label="New password"
              value={next}
              autoComplete="new-password"
              show={showNext}
              error={errors.next}
              onChange={(value) => {
                setNext(value);
                setErrors((prev) => ({ ...prev, next: "" }));
              }}
              onToggle={() => setShowNext((prev) => !prev)}
            />
            <PasswordField
              label="Confirm new password"
              value={confirm}
              autoComplete="new-password"
              show={showConfirm}
              error={errors.confirm}
              onChange={(value) => {
                setConfirm(value);
                setErrors((prev) => ({ ...prev, confirm: "" }));
              }}
              onToggle={() => setShowConfirm((prev) => !prev)}
            />

            <div className={styles.actions}>
              <button
                type="submit"
                className={[btn.btn, btn.primary].join(" ")}
                disabled={saving}
              >
                {saving ? "Changing…" : "Change password"}
              </button>
              {saved ? <span className={styles.ok}>Password changed</span> : null}
            </div>
          </form>
        </section>

        <div className={styles.version}>version {APP_VERSION}</div>
      </div>
    </div>
  );
};

export default SettingsPage;
