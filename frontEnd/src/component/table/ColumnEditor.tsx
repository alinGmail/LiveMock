import styles from "./ColumnEditor.module.css";
import react, { useRef, useState } from "react";
import Icon, {
  AlignLeftOutlined,
  CloseCircleOutlined,
  RightOutlined,
} from "@ant-design/icons";
import { Dropdown, Input, Typography } from "antd";
import {ReactComponent as BracketIcon} from "../../svg/brackets-curly.svg";
import { useClickAway, useDebounce, useUpdateEffect } from "ahooks";
import {
  ColumnDisplayType,
  modifyTableColumn,
  TableColumnItem,
} from "../../slice/logSlice";
import { useImmer } from "use-immer";
import { useDispatch } from "react-redux";

const { Text } = Typography;

export const ColumnEditor: react.FC<{
  onClose: () => void;
  show: boolean;
  tableColumnItem: TableColumnItem;
}> = ({ onClose, show, tableColumnItem }) => {
  const dispatch = useDispatch();
  const [showDisplayType, setShowDisplayType] = useState<boolean>(false);
  const columnRef = useRef<HTMLDivElement>(null);
  const [menuRef, setMenuRef] = useState<HTMLElement | null>(null);
  const [columnImmerItem, setColumnImmerItem] = useImmer(tableColumnItem);

  const debouncedColumnItem = useDebounce(columnImmerItem, { wait: 800 });

  const [displayTypeShow, setDisplayTypeShow] = useState<boolean>(false);

  useUpdateEffect(() => {
    setColumnImmerItem(tableColumnItem);
  }, [tableColumnItem]);
  useUpdateEffect(() => {
    dispatch(modifyTableColumn(debouncedColumnItem));
  }, [debouncedColumnItem]);

  useClickAway(
    () => {
      onClose();
    },
    [columnRef, menuRef].filter((item) => item != null)
  );

  return (
    <div
      className={[styles.addColumnWrap, show ? styles.columnShow : ""].join(
        " "
      )}
      style={{}}
      ref={columnRef}
    >
      <div className={styles.headRow}>
        <div className={styles.headTitle}>edit property</div>
        <div className={styles.headClose}>
          <CloseCircleOutlined
            style={{
              color: "#999",
              cursor: "pointer",
            }}
            onClick={onClose}
          />
        </div>
      </div>
      <div className={styles.properEditRow}>
        <div className={styles.properItem}>
          <Text type="secondary" className={styles.properTitle}>
            Title
          </Text>
          <Input
            size={"small"}
            className={styles.properInp}
            value={columnImmerItem.label}
            onChange={(event) => {
              setColumnImmerItem((column) => {
                column.label = event.target.value;
              });
            }}
          />
        </div>
        <div className={styles.properItem}>
          <Text type="secondary" className={styles.properTitle}>
            Path
          </Text>
          <Input
            size={"small"}
            className={styles.properInp}
            value={columnImmerItem.path}
            onChange={(event) => {
              setColumnImmerItem((column) => {
                column.path = event.target.value;
              });
            }}
          />
        </div>
      </div>

      <Dropdown
        trigger={["click"]}
        visible={displayTypeShow}
        onVisibleChange={(visible) => {
          setDisplayTypeShow(visible);
        }}
        overlay={() => {
          return (
            <div className={"menuWrap"} ref={setMenuRef}>
              <div className="menu">
                <div
                  className="menuItem"
                  onClick={() => {
                    setColumnImmerItem((column) => {
                      column.displayType = ColumnDisplayType.TEXT;
                    });
                    setDisplayTypeShow(false);
                  }}
                >
                  <AlignLeftOutlined style={{verticalAlign:"middle"}}/>
                  &nbsp;
                  <span style={{verticalAlign:"middle"}}>Text</span>
                </div>
                <div
                  className="menuItem"
                  onClick={() => {
                    setColumnImmerItem((column) => {
                      column.displayType = ColumnDisplayType.JSON;
                    });
                    setDisplayTypeShow(false);
                  }}
                >
                  <BracketIcon style={{width:"16px",verticalAlign:"middle"}}  />
                  &nbsp;
                  <span style={{verticalAlign:"middle"}}>Json</span>
                </div>
              </div>
            </div>
          );
        }}
      >
        <div
          className={styles.displayTypeRow}
          onClick={() => {
            setShowDisplayType(!showDisplayType);
          }}
        >
          <div className={styles.typeLabel}>Type</div>
          <div className={styles.typeCur}>
            {columnImmerItem.displayType == ColumnDisplayType.TEXT && (
              <>
                <AlignLeftOutlined style={{verticalAlign:"middle"}}/>
                &nbsp;
                <span style={{verticalAlign:"middle"}}>Text</span>
              </>
            )}
            {columnImmerItem.displayType == ColumnDisplayType.JSON && (
              <>
                <BracketIcon style={{width:"16px",verticalAlign:"middle"}}  />
                &nbsp;
                <span style={{verticalAlign:"middle"}}>Json</span>
              </>
            )}
            &nbsp;
            <RightOutlined
              rotate={showDisplayType ? 90 : 0}
              className={styles.arrow}
            />
          </div>
        </div>
      </Dropdown>
    </div>
  );
};
