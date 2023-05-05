import react, { useState } from "react";
import { Dropdown } from "antd";
import styles from "../MatcherItem.module.css";
import React from "react";
import { RequestMatcherType } from "core/struct/matcher";

const MatcherTypeMenu = ({
  onTypeChange,
}: {
  onTypeChange?: (matcherType: RequestMatcherType) => void;
}) => {
  return (
    <div className={"menuWrap"}>
      <div className={"menu"}>
        {Object.values(RequestMatcherType).map((matcherType) => {
          return (
            <div
              key={matcherType}
              className={"menuItem"}
              onClick={(event) => {
                onTypeChange && onTypeChange(matcherType);
              }}
            >
              {matcherType}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export const MatcherTypeSelector: react.FC<{
  onTypeChange: (type: RequestMatcherType) => void;
  type: RequestMatcherType;
}> = ({ onTypeChange, type }) => {
  const [typeDropShow, setTypeDropShow] = useState(false);
  return (
    <Dropdown
      overlay={
        <MatcherTypeMenu
          onTypeChange={(matcherType) => {
            onTypeChange(matcherType);
            setTypeDropShow(false);
          }}
        />
      }
      trigger={["click"]}
      visible={typeDropShow}
      onVisibleChange={(visible) => {
        //console.log(visible);
        setTypeDropShow(visible);
      }}
    >
      <span className={styles.textBtn}>{type}</span>
    </Dropdown>
  );
};

export default MatcherTypeSelector;
