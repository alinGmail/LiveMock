import styles from "./Toggle.module.scss";

interface ToggleProps {
  checked: boolean;
  onChange: (value: boolean) => void;
  label: string;
  disabled?: boolean;
}

const Toggle = ({ checked, onChange, label, disabled }: ToggleProps) => (
  <button
    type="button"
    role="switch"
    aria-checked={checked}
    aria-label={label}
    disabled={disabled}
    className={[styles.switch, checked ? styles.switchOn : ""].join(" ")}
    onClick={() => onChange(!checked)}
  >
    <span className={styles.switchKnob} />
  </button>
);

export default Toggle;
