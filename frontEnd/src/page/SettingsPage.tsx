import { FormEvent, useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ApiTokenRecord,
  changePasswordReq,
  CreateApiTokenResponse,
  createApiTokenReq,
  listApiTokensReq,
  revokeApiTokenReq,
} from "../server/authServer";
import { getErrorMessage } from "../component/common";
import { useAppSelector } from "../store";
import EyeIcon from "../component/EyeIcon";
import Modal from "../component/Modal";
import btn from "../component/buttonStyles.module.scss";
import styles from "./SettingsPage.module.scss";

const EXPIRY_OPTIONS = [
  { value: "never", label: "Never" },
  { value: "7", label: "7 days" },
  { value: "30", label: "30 days" },
  { value: "90", label: "90 days" },
  { value: "custom", label: "Custom…" },
];

function formatTime(value: number | null): string {
  return value === null ? "Never" : new Date(value).toLocaleString();
}

function maskPrefix(prefix: string): string {
  return `${prefix}…`;
}

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

  const [tokens, setTokens] = useState<ApiTokenRecord[]>([]);
  const [tokensLoading, setTokensLoading] = useState(true);
  const [tokensError, setTokensError] = useState("");
  const [tokenName, setTokenName] = useState("");
  const [tokenExpiry, setTokenExpiry] = useState("never");
  const [customExpiry, setCustomExpiry] = useState("30");
  const [tokenFormError, setTokenFormError] = useState("");
  const [creatingToken, setCreatingToken] = useState(false);
  const [createdToken, setCreatedToken] =
    useState<CreateApiTokenResponse | null>(null);
  const [copiedToken, setCopiedToken] = useState(false);
  const [revokeTarget, setRevokeTarget] = useState<ApiTokenRecord | null>(null);
  const [revoking, setRevoking] = useState(false);

  const loadTokens = useCallback(async () => {
    setTokensLoading(true);
    setTokensError("");
    try {
      setTokens(await listApiTokensReq());
    } catch (error) {
      setTokensError(getErrorMessage(error));
    } finally {
      setTokensLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadTokens();
  }, [loadTokens]);

  const submitToken = async (event: FormEvent) => {
    event.preventDefault();
    if (creatingToken) {
      return;
    }
    const name = tokenName.trim();
    if (!name) {
      setTokenFormError("Please input a token name");
      return;
    }
    if (name.length > 64) {
      setTokenFormError("At most 64 characters");
      return;
    }
    if (tokens.some((token) => token.name === name)) {
      setTokenFormError("A token with this name already exists.");
      return;
    }

    let expiresInDays: number | undefined;
    if (tokenExpiry !== "never") {
      const days = parseInt(
        tokenExpiry === "custom" ? customExpiry : tokenExpiry,
        10
      );
      if (!Number.isInteger(days) || days < 1 || days > 3650) {
        setTokenFormError("Expiry must be between 1 and 3650 days");
        return;
      }
      expiresInDays = days;
    }

    setCreatingToken(true);
    setTokenFormError("");
    try {
      const created = await createApiTokenReq(name, expiresInDays);
      setCreatedToken(created);
      setCopiedToken(false);
      setTokenName("");
      setTokenExpiry("never");
      setCustomExpiry("30");
      await loadTokens();
    } catch (error) {
      setTokenFormError(getErrorMessage(error));
    } finally {
      setCreatingToken(false);
    }
  };

  const copyCreatedToken = async () => {
    if (!createdToken) {
      return;
    }
    try {
      await navigator.clipboard.writeText(createdToken.token);
      setCopiedToken(true);
    } catch {
      setCopiedToken(false);
    }
  };

  const confirmRevoke = async () => {
    if (!revokeTarget || revoking) {
      return;
    }
    setRevoking(true);
    setTokensError("");
    try {
      await revokeApiTokenReq(revokeTarget.id);
      setRevokeTarget(null);
      await loadTokens();
    } catch (error) {
      setTokensError(getErrorMessage(error));
    } finally {
      setRevoking(false);
    }
  };

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
      // A password change revokes every API token.
      await loadTokens();
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

        <section className={styles.card}>
          <div className={styles.cardHead}>
            <h3>API tokens</h3>
            <span className={styles.hint}>
              For MCP clients and scripts · full data access
            </span>
          </div>
          <div className={styles.cardBody}>
            {tokensError ? (
              <div className={styles.formError} role="alert">
                {tokensError}
              </div>
            ) : null}

            <form
              className={styles.tokenForm}
              onSubmit={submitToken}
              noValidate
            >
              <label className={styles.field}>
                <span className={styles.label}>Name</span>
                <input
                  className={styles.input}
                  value={tokenName}
                  placeholder="e.g. claude-code"
                  autoComplete="off"
                  onChange={(event) => {
                    setTokenName(event.target.value);
                    setTokenFormError("");
                  }}
                />
              </label>
              <label className={styles.field}>
                <span className={styles.label}>Expiry</span>
                <select
                  className={styles.select}
                  value={tokenExpiry}
                  onChange={(event) => {
                    setTokenExpiry(event.target.value);
                    setTokenFormError("");
                  }}
                >
                  {EXPIRY_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
              {tokenExpiry === "custom" ? (
                <label className={styles.field}>
                  <span className={styles.label}>Days</span>
                  <input
                    className={styles.input}
                    inputMode="numeric"
                    value={customExpiry}
                    onChange={(event) => {
                      setCustomExpiry(event.target.value);
                      setTokenFormError("");
                    }}
                  />
                </label>
              ) : null}
              <button
                type="submit"
                className={[btn.btn, btn.primary].join(" ")}
                disabled={creatingToken}
              >
                {creatingToken ? "Creating…" : "Create token"}
              </button>
            </form>
            {tokenFormError ? (
              <div className={styles.formError} role="alert">
                {tokenFormError}
              </div>
            ) : null}

            <div className={styles.tokenList}>
              {tokensLoading ? (
                <div className={styles.tokenEmpty}>Loading…</div>
              ) : tokens.length === 0 ? (
                <div className={styles.tokenEmpty}>
                  No API tokens yet. Create one to connect an MCP client.
                </div>
              ) : (
                <>
                  <div
                    className={[styles.tokenRow, styles.tokenHead].join(" ")}
                  >
                    <span>Name</span>
                    <span>Prefix</span>
                    <span>Created</span>
                    <span>Last used</span>
                    <span>Expires</span>
                    <span />
                  </div>
                  {tokens.map((token) => (
                    <div className={styles.tokenRow} key={token.id}>
                      <span className={styles.tokenName}>{token.name}</span>
                      <code className={styles.tokenCode}>
                        {maskPrefix(token.prefix)}
                      </code>
                      <span>{formatTime(token.createTime)}</span>
                      <span>{formatTime(token.lastUsedAt)}</span>
                      <span
                        className={
                          token.expiresAt !== null &&
                          token.expiresAt <= Date.now()
                            ? styles.tokenExpired
                            : undefined
                        }
                      >
                        {formatTime(token.expiresAt)}
                      </span>
                      <button
                        type="button"
                        className={[btn.btn, btn.ghost].join(" ")}
                        onClick={() => setRevokeTarget(token)}
                      >
                        Revoke
                      </button>
                    </div>
                  ))}
                </>
              )}
            </div>
          </div>
        </section>

        <div className={styles.version}>version {APP_VERSION}</div>
      </div>

      {createdToken ? (
        <Modal
          title="API token created"
          size="sm"
          onClose={() => {
            setCreatedToken(null);
            setCopiedToken(false);
          }}
          footer={
            <button
              type="button"
              className={[btn.btn, btn.primary].join(" ")}
              onClick={() => {
                setCreatedToken(null);
                setCopiedToken(false);
              }}
            >
              Done
            </button>
          }
        >
          <p className={styles.tokenDialogHint}>
            Copy this token now. It will not be shown again.
          </p>
          <div className={styles.tokenSecret}>
            <code>{createdToken.token}</code>
          </div>
          <div className={styles.actions}>
            <button
              type="button"
              className={[btn.btn, btn.ghost].join(" ")}
              onClick={copyCreatedToken}
            >
              {copiedToken ? "Copied" : "Copy token"}
            </button>
          </div>
          <p className={styles.tokenDialogMeta}>
            {createdToken.name} · expires {formatTime(createdToken.expiresAt)}
          </p>
        </Modal>
      ) : null}

      {revokeTarget ? (
        <Modal
          title="Revoke API token"
          size="sm"
          onClose={() => {
            if (!revoking) {
              setRevokeTarget(null);
            }
          }}
          footer={
            <>
              <button
                type="button"
                className={[btn.btn, btn.ghost].join(" ")}
                disabled={revoking}
                onClick={() => setRevokeTarget(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                className={[btn.btn, btn.dangerSolid].join(" ")}
                disabled={revoking}
                onClick={confirmRevoke}
              >
                {revoking ? "Revoking…" : "Revoke"}
              </button>
            </>
          }
        >
          <p className={styles.tokenDialogHint}>
            Any client using <strong>{revokeTarget.name}</strong> will lose
            access immediately.
          </p>
        </Modal>
      ) : null}
    </div>
  );
};

export default SettingsPage;
