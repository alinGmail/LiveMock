import { Select as AntSelect, SelectProps } from "antd";
import styles from "./Select.module.scss";

/** Thin chevron matching the redesign's selects (not antd's filled down icon). */
const ChevronIcon = () => (
  <svg
    width={14}
    height={14}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="m6 9 6 6 6-6" />
  </svg>
);

/**
 * antd Select themed to match the redesign tokens (trigger + popup), so it
 * matches the look of the app's inputs instead of antd's default surfaces, with
 * the redesign's chevron instead of antd's filled down arrow.
 */
const Select = ({
  className,
  popupClassName,
  suffixIcon,
  ...props
}: SelectProps) => (
  <AntSelect
    {...props}
    suffixIcon={suffixIcon ?? <ChevronIcon />}
    className={[styles.select, className].filter(Boolean).join(" ")}
    popupClassName={[styles.popup, popupClassName].filter(Boolean).join(" ")}
  />
);

export default Select;
