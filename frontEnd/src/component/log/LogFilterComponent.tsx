import React from "react";
import { FilterType, LogFilterM } from "core/struct/log";
import mStyle from "./LogFilterComponent.module.scss";
import { Button, Dropdown } from "antd";
import { getStringConditionWord } from "./utils";
import { DownOutlined } from "@ant-design/icons";
import { NInput } from "../nui/NInput";

const LogFilterComponent: React.FC<{ filter: LogFilterM }> = ({ filter }) => {
  if (filter.type === FilterType.SIMPLE_FILTER) {
    return (
      <Dropdown
        overlay={
          <div>
            <div
              style={{
                display: "inline-block",
              }}
            >
              <NInput value={filter.property} onChange={(value) => {}} />
            </div>
            <Dropdown overlay={<div>fff</div>}>
              <div
                className={[mStyle.textBtn, mStyle.conditionSpan].join(" ")}
                onClick={() => {
                  //setConditionSelShow(!conditionSelShow);
                }}
                //ref={conditionRef}
              >
                <div className={mStyle.conditionWrap}>
                  {getStringConditionWord(filter.condition)}
                  <svg
                    viewBox="0 0 30 30"
                    className={mStyle.chevronDown}
                    style={{
                      width: "10px",
                      height: "100%",
                      display: "block",
                      fill: "rgba(55,53,47,0.35)",
                      flexShrink: "0",
                      backfaceVisibility: "hidden",
                      marginLeft: "4px",
                      marginTop: "1px",
                    }}
                  >
                    <polygon points="15,17.4 4.8,7 2,9.8 15,23 28,9.8 25.2,7 " />
                  </svg>
                </div>
              </div>
            </Dropdown>
            <div
              style={{
                marginTop: "6px",
                marginBottom: "1px",
                minWidth: "100px",
                display: "inline-block",
              }}
            >
              <NInput value={filter.value} onChange={() => {}} />
            </div>
          </div>
        }
      >
        <div
          style={{ marginRight: "10px" }}
          className={[filter.activate ? mStyle.filterActivate : ""].join("")}
        >
          {/******* button ******/}
          <Button
            type={"default"}
            className={mStyle.simpleFilter}
            size={"small"}
          >
            {filter.property ? (
              <span className={mStyle.property}>{filter.property}</span>
            ) : (
              <span className={mStyle.placeHolder}>empty&nbsp;</span>
            )}
            <div className={mStyle.condition}>
              {getStringConditionWord(filter.condition)}
            </div>
            {filter.value ? (
              <div className={mStyle.value}>{filter.value}</div>
            ) : (
              <span className={mStyle.placeHolder}>empty&nbsp;</span>
            )}
            <svg
              viewBox="0 0 30 30"
              className={mStyle.chevronDown}
              style={{
                width: "10px",
                height: "100%",
                display: "block",
                flexShrink: "0",
                backfaceVisibility: "hidden",
                marginLeft: "4px",
                marginTop: "1px",
              }}
            >
              <polygon points="15,17.4 4.8,7 2,9.8 15,23 28,9.8 25.2,7 " />
            </svg>
          </Button>
          {/******* button end ******/}
        </div>
      </Dropdown>
    );
  }
  return <div></div>;
};

export default LogFilterComponent;
