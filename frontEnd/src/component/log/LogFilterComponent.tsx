import React, { useState } from "react";
import { FilterType, LogFilterCondition, LogFilterM } from "core/struct/log";
import mStyle from "./LogFilterComponent.module.scss";
import { Button, Dropdown } from "antd";
import { getStringConditionWord } from "./utils";
import { CloseSquareOutlined, DownOutlined } from "@ant-design/icons";
import { NInput } from "../nui/NInput";
import { useDispatch } from "react-redux";
import { modifyLogFilter, removeLogFilter } from "../../slice/logSlice";
import {
  deleteLogFilterReq,
  updateLogFilterReq,
} from "../../server/logFilterServer";
import { useDebounceFn } from "ahooks";
import { debounceWait } from "../../config";
import {
  DeleteLogFilterReqQuery,
  UpdateLogFilterReqBody,
} from "core/struct/params/LogFilterParam";
import { toastPromise } from "../common";

function ChevronDown({ fill }: { fill: string }) {
  return (
    <svg
      viewBox="0 0 30 30"
      className={mStyle.chevronDown}
      style={{
        width: "10px",
        height: "100%",
        display: "block",
        fill: fill,
        flexShrink: "0",
        backfaceVisibility: "hidden",
        marginLeft: "4px",
        marginTop: "1px",
      }}
    >
      <polygon points="15,17.4 4.8,7 2,9.8 15,23 28,9.8 25.2,7 " />
    </svg>
  );
}

const LogFilterComponent: React.FC<{
  filter: LogFilterM;
  logViewId: string;
  projectId: string;
  refreshLogList: () => void;
}> = ({ filter, logViewId, projectId, refreshLogList }) => {
  const [conditionShow, setConditionShow] = useState(false);

  const { run: updateFilter } = useDebounceFn(
    (logFilterId: string, param: UpdateLogFilterReqBody) => {
      // update filter
      const updatePromise = updateLogFilterReq(logFilterId, param);
      toastPromise(updatePromise);
      updatePromise.then(res =>{
          refreshLogList();
      });
    },
    { wait: debounceWait }
  );

  const dispatch = useDispatch();
  if (filter.type === FilterType.SIMPLE_FILTER) {
    return (
      <Dropdown
        trigger={["click"]}
        overlay={
          <div className={"popper"}>
            <div
              style={{
                display: "inline-block",
                verticalAlign: "middle",
                marginLeft: "4px",
              }}
            >
              <NInput
                value={filter.property}
                onChange={(value) => {
                  const modifiedFilter = Object.assign({}, filter, {
                    property: value,
                  } as Partial<LogFilterM>);
                  dispatch(modifyLogFilter(modifiedFilter));
                  updateFilter(filter.id, {
                    filter: modifiedFilter,
                    projectId: projectId,
                    logViewId: logViewId,
                  });
                }}
              />
            </div>
            <Dropdown
              visible={conditionShow}
              onVisibleChange={(visible) => {
                setConditionShow(visible);
              }}
              overlay={
                <div className={"menuWrap"}>
                  <div className={"menu"}>
                    {Object.keys(LogFilterCondition).map((item) => {
                      return (
                        <div
                          onClick={() => {
                            const modifiedFilter = Object.assign({}, filter, {
                              condition: item,
                            } as Partial<LogFilterM>);
                            dispatch(modifyLogFilter(modifiedFilter));
                            updateFilter(filter.id, {
                              filter: modifiedFilter,
                              projectId: projectId,
                              logViewId: logViewId,
                            });
                            setConditionShow(false);
                          }}
                          className={"menuItem"}
                        >
                          {item}
                        </div>
                      );
                    })}
                  </div>
                </div>
              }
            >
              <div
                className={[mStyle.textBtn, mStyle.conditionSpan].join(" ")}
                onClick={() => {
                  //setConditionSelShow(!conditionSelShow);
                }}
                //ref={conditionRef}
              >
                <div className={mStyle.conditionWrap}>
                  {getStringConditionWord(filter.condition)}
                  <ChevronDown fill={"rgba(55,53,47,0.35)"} />
                </div>
              </div>
            </Dropdown>
            <div
              style={{
                marginBottom: "1px",
                minWidth: "100px",
                display: "inline-block",
                verticalAlign: "middle",
              }}
            >
              <NInput
                value={filter.value}
                onChange={(value) => {
                  const modifiedFilter = Object.assign({}, filter, {
                    value: value,
                  } as Partial<LogFilterM>);
                  dispatch(modifyLogFilter(modifiedFilter));
                  updateFilter(filter.id, {
                    filter: modifiedFilter,
                    projectId: projectId,
                    logViewId: logViewId,
                  });
                }}
              />
            </div>
            <CloseSquareOutlined
              style={{ display: "inline-block", verticalAlign: "middle" }}
              className={mStyle.closeBtn}
              onClick={() => {
                const deletePromise = deleteLogFilterReq(filter.id, {
                  logViewId,
                  projectId,
                });
                toastPromise(deletePromise);
                refreshLogList();
                dispatch(removeLogFilter(filter.id));
              }}
            />
          </div>
        }
      >
        <div
          style={{ marginRight: "10px", display: "inline-block" }}
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
            <ChevronDown fill={"rgba(55,53,47,0.35)"} />
          </Button>
          {/******* button end ******/}
        </div>
      </Dropdown>
    );
  }
  return <div></div>;
};

export default LogFilterComponent;
