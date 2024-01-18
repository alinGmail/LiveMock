import React, { useRef } from "react";
import styles from "./ColumnConfig.module.scss";
import Icon, {
  AlignLeftOutlined,
  CloseCircleOutlined,
} from "@ant-design/icons";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "../../store";
import { ReactComponent as Eye } from "../../svg/eye.svg";
import { ReactComponent as EyeBlock } from "../../svg/eye-blocked.svg";
import { ReactComponent as BracketsIcon } from "../../svg/brackets-curly.svg";
import classNames from "classnames";
import {
  ColumnDisplayType,
  hideColumnConfig,
  modifyAllTableColumnVisible,
  modifyTableColumn,
  modifyTableColumnVisible,
  setDefaultColumnVisible,
} from "../../slice/logSlice";
import { useClickAway } from "ahooks";
import { AnyAction, Dispatch } from "@reduxjs/toolkit";
import { getDefaultColumnTitles } from "../log/utils";

const ColumnConfig: React.FC<{
  show: boolean;
}> = ({ show }) => {
  const requestLogState = useSelector((state: RootState) => state.log);
  let {
    columnEditorShow,
    currentColumnEditIndex,
    defaultColumnVisible,
    tableColumns,
  } = requestLogState;
  const defaultColumnTitles = getDefaultColumnTitles();
  const dispatch = useDispatch();

  const wrapRef = useRef<HTMLDivElement>(null);

  useClickAway(() => {
    dispatch(hideColumnConfig());
  }, [wrapRef]);

  return (
    <div
      className={classNames(styles.wrap, show && styles.wrapShow)}
      ref={wrapRef}
    >
      <div className={styles.headRow}>
        <div className={styles.headTitle}>Properties</div>
        <div className={styles.headClose}>
          <CloseCircleOutlined
            style={{
              color: "#999",
              cursor: "pointer",
              userSelect: "none",
            }}
            onClick={() => {
              dispatch(hideColumnConfig());
            }}
          />
        </div>
      </div>
      <div className={styles.titleRow}>
        <div className={styles.titleLabel}>Shown in table</div>
        <div className={styles.titleBtnColumn}>
          <div
            className={styles.titleBtn}
            onClick={() => {
              dispatch(modifyAllTableColumnVisible({ visible: false }));
            }}
          >
            Hide all
          </div>
        </div>
      </div>
      <div className={styles.configList}>
        {defaultColumnTitles.map((item, index) => {
          if (defaultColumnVisible[index]) {
            return (
              <ConfigRow
                title={item.title}
                visible={true}
                displayType={item.displayType}
                type={"default"}
                key={"default" + index}
                index={index}
              />
            );
          } else {
            return null;
          }
        })}
        {tableColumns.map((column, index) => {
          if (column.visible) {
            return (
              <ConfigRow
                title={column.label}
                visible={true}
                displayType={column.displayType}
                type={"custom"}
                key={"custom" + index}
                index={index}
              />
            );
          } else {
            return null;
          }
        })}
      </div>

      <div className={styles.titleRow}>
        <div className={styles.titleLabel}>Hidden in table</div>
        <div className={styles.titleBtnColumn}>
          <div
            className={styles.titleBtn}
            onClick={() => {
              dispatch(modifyAllTableColumnVisible({ visible: true }));
            }}
          >
            Show all
          </div>
        </div>
      </div>
      <div className={styles.configList}>
        {defaultColumnTitles.map((item, index) => {
          if (!defaultColumnVisible[index]) {
            return (
              <ConfigRow
                title={item.title}
                visible={false}
                displayType={item.displayType}
                type={"default"}
                key={"default" + index}
                index={index}
              />
            );
          } else {
            return null;
          }
        })}
        {tableColumns.map((column, index) => {
          if (column.visible) {
            return null;
          } else {
            return (
              <ConfigRow
                title={column.label}
                visible={false}
                displayType={column.displayType}
                type={"custom"}
                key={"custom" + index}
                index={index}
              />
            );
          }
        })}
      </div>
    </div>
  );
};

const ConfigRow = ({
  title,
  displayType,
  type,
  index,
  visible,
}: {
  title: string;
  displayType: ColumnDisplayType;
  type: "default" | "custom";
  index: number;
  visible: boolean;
}) => {
  const dispatch = useDispatch();
  return (
    <div className={styles.configRow}>
      <div className={styles.configRowLeft}>
        {displayType == ColumnDisplayType.JSON ? (
          <BracketsIcon style={{ width: "16px", verticalAlign: "middle" }} />
        ) : (
          <AlignLeftOutlined style={{ verticalAlign: "middle" }} />
        )}
        &nbsp;<span style={{ verticalAlign: "middle" }}>{title}</span>
      </div>
      <div className={styles.configRowRight}>
        <div
          className={styles.iconWrap}
          onClick={(event) => {
            event.stopPropagation();
            if (type == "default") {
              dispatch(
                setDefaultColumnVisible({
                  index,
                  visible: !visible,
                })
              );
            } else {
              dispatch(
                modifyTableColumnVisible({
                  index,
                  visible: !visible,
                })
              );
            }
          }}
        >
          {visible ? (
            <EyeBlock style={{ width: "16px", verticalAlign: "middle" }} />
          ) : (
            <Eye style={{ width: "16px", verticalAlign: "middle" }} />
          )}
        </div>
      </div>
    </div>
  );
};

export default ColumnConfig;
