import styles from "./NButton.module.css";
import * as React from "react";

const NButton: React.FC<{
  icon?: React.ReactNode;
}> = ({ icon }) => {
  return <div className={styles.btnWrap}>{icon ? icon : null}</div>;
};
export default NButton;
