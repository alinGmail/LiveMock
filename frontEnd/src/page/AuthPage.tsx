import { FormEvent, useEffect, useState } from "react";
import { loginReq, registerReq } from "../server/authServer";
import { getErrorMessage } from "../component/common";
import logoUrl from "../assets/logo.png";
import btn from "../component/buttonStyles.module.scss";
import EyeIcon from "../component/EyeIcon";
import styles from "./AuthPage.module.scss";

interface AuthPageProps {
  mode: "login" | "register";
  onSuccess: (username: string) => void;
}

interface FormErrors {
  username?: string;
  password?: string;
  confirm?: string;
  form?: string;
}

/**
 * First-run register / returning login. Matches the redesign's auth screen:
 * centered card, inline field errors and a form-level error, password reveal
 * toggles, and no toasts.
 */
const AuthPage = ({ mode, onSuccess }: AuthPageProps) => {
  const [localMode, setLocalMode] = useState<"login" | "register">(mode);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setLocalMode(mode);
  }, [mode]);

  const register = localMode === "register";

  const switchMode = (next: "login" | "register") => {
    setLocalMode(next);
    setErrors({});
    setPassword("");
    setConfirm("");
    setShowPassword(false);
    setShowConfirm(false);
  };

  const validate = (): boolean => {
    const next: FormErrors = {};
    const trimmed = username.trim();
    if (!trimmed) {
      next.username = "Please input your username";
    } else if (trimmed.length > 64) {
      next.username = "At most 64 characters";
    }
    if (!password) {
      next.password = "Please input your password";
    } else if (register && password.length < 8) {
      next.password = "At least 8 characters";
    } else if (register && password.length > 64) {
      next.password = "At most 64 characters";
    }
    if (register) {
      if (!confirm) {
        next.confirm = "Please confirm your password";
      } else if (confirm !== password) {
        next.confirm = "Passwords do not match";
      }
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (submitting || !validate()) {
      return;
    }
    setSubmitting(true);
    setErrors({});
    try {
      const res = register
        ? await registerReq(username.trim(), password)
        : await loginReq(username.trim(), password);
      onSuccess(res.username);
    } catch (error) {
      setErrors({ form: getErrorMessage(error) });
      setSubmitting(false);
    }
  };

  return (
    <div className={styles.shell}>
      <div className={styles.card}>
        <div className={styles.brand}>
          <img src={logoUrl} alt="" />
          <span>LiveMock</span>
        </div>
        <h1>{register ? "Create your account" : "Welcome back"}</h1>
        <p className={styles.sub}>
          {register
            ? "First run — this single account protects the dashboard and API."
            : "Sign in to continue to your dashboard."}
        </p>

        <form className={styles.form} onSubmit={submit} noValidate>
          {errors.form ? (
            <div className={styles.formError} role="alert">
              {errors.form}
            </div>
          ) : null}

          <label className={styles.field}>
            <span className={styles.label}>Username</span>
            <input
              className={styles.input}
              value={username}
              autoComplete="username"
              autoFocus
              onChange={(event) => {
                setUsername(event.target.value);
                setErrors((prev) => ({ ...prev, username: undefined }));
              }}
            />
            {errors.username ? (
              <span className={styles.error}>{errors.username}</span>
            ) : null}
          </label>

          <label className={styles.field}>
            <span className={styles.label}>Password</span>
            <span className={styles.pwWrap}>
              <input
                className={styles.input}
                type={showPassword ? "text" : "password"}
                value={password}
                autoComplete={register ? "new-password" : "current-password"}
                onChange={(event) => {
                  setPassword(event.target.value);
                  setErrors((prev) => ({ ...prev, password: undefined }));
                }}
              />
              <button
                type="button"
                className={[styles.pwEye, showPassword ? styles.pwEyeOn : ""].join(
                  " "
                )}
                aria-label={showPassword ? "Hide password" : "Show password"}
                onClick={() => setShowPassword((prev) => !prev)}
              >
                <EyeIcon off={showPassword} />
              </button>
            </span>
            {errors.password ? (
              <span className={styles.error}>{errors.password}</span>
            ) : null}
          </label>

          {register ? (
            <label className={styles.field}>
              <span className={styles.label}>Confirm password</span>
              <span className={styles.pwWrap}>
                <input
                  className={styles.input}
                  type={showConfirm ? "text" : "password"}
                  value={confirm}
                  autoComplete="new-password"
                  onChange={(event) => {
                    setConfirm(event.target.value);
                    setErrors((prev) => ({ ...prev, confirm: undefined }));
                  }}
                />
                <button
                  type="button"
                  className={[styles.pwEye, showConfirm ? styles.pwEyeOn : ""].join(
                    " "
                  )}
                  aria-label={showConfirm ? "Hide password" : "Show password"}
                  onClick={() => setShowConfirm((prev) => !prev)}
                >
                  <EyeIcon off={showConfirm} />
                </button>
              </span>
              {errors.confirm ? (
                <span className={styles.error}>{errors.confirm}</span>
              ) : null}
            </label>
          ) : null}

          <button
            type="submit"
            className={[btn.btn, btn.primary, styles.submit].join(" ")}
            disabled={submitting}
          >
            {submitting
              ? register
                ? "Creating account…"
                : "Signing in…"
              : register
                ? "Create account"
                : "Sign in"}
          </button>
        </form>

        {register ? (
          <p className={styles.switch}>
            Already have an account?{" "}
            <button
              type="button"
              className={styles.link}
              onClick={() => switchMode("login")}
            >
              Sign in
            </button>
          </p>
        ) : null}
        <p className={styles.foot}>Self-hosted · one account per instance</p>
      </div>
    </div>
  );
};

export default AuthPage;
