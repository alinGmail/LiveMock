import { Select as AntSelect, SelectProps } from "antd";
import styles from "./Select.module.scss";

/**
 * antd Select themed to match the redesign tokens (trigger + popup), so it
 * matches the look of the app's inputs instead of antd's default surfaces.
 */
const Select = ({ className, popupClassName, ...props }: SelectProps) => (
  <AntSelect
    {...props}
    className={[styles.select, className].filter(Boolean).join(" ")}
    popupClassName={[styles.popup, popupClassName].filter(Boolean).join(" ")}
  />
);

export default Select;
