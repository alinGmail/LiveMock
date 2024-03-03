import React from "react";
import mStyle from "./FilterRowComponent.module.scss";
import LogFilterComponent from "./LogFilterComponent";
import { addLogFilter, LogState } from "../../slice/logSlice";
import { ProjectM } from "core/build/struct/project";
import { useDispatch } from "react-redux";
import { Button } from "antd";
import { createSimpleFilter } from "core/struct/log";
import { addLogFilterReq } from "../../server/logFilterServer";
import { toastPromise } from "../common";
import { PlusOutlined } from "@ant-design/icons";
import { UseQueryResult } from "@tanstack/react-query";
import { ListLogViewResponse } from "core/struct/response/LogResponse";

const FilterRowComponent: React.FunctionComponent<{
  logViewId: string | undefined;
  logState: LogState;
  currentProject: ProjectM;
  refreshLogList: () => void;
  getLogViewQuery: UseQueryResult<ListLogViewResponse>;
}> = ({
  logViewId,
  logState,
  currentProject,
  refreshLogList,
  getLogViewQuery,
}) => {
  return (
    <div className={mStyle.filterRow}>
      <div className={mStyle.filterCol}>
        {logViewId &&
          logState.logFilter.map((filter) => {
            return (
              <LogFilterComponent
                filter={filter}
                key={filter.id}
                projectId={currentProject.id}
                logViewId={logViewId}
                refreshLogList={refreshLogList}
              />
            );
          })}
        {getLogViewQuery.isSuccess && (
          <AddLogFilterBtn
            refreshLogList={refreshLogList}
            projectId={currentProject.id}
            logViewId={getLogViewQuery.data[0]?.id}
          />
        )}
      </div>
      <div className={mStyle.btnCol}>
          <Button>clear all</Button>
      </div>
    </div>
  );
};

function AddLogFilterBtn({
  logViewId,
  projectId,
  refreshLogList,
}: {
  logViewId: string;
  projectId: string;
  refreshLogList: () => void;
}) {
  const dispatch = useDispatch();
  return (
    <Button
      onClick={() => {
        const simpleFilterM = createSimpleFilter();
        dispatch(addLogFilter(simpleFilterM));
        const addPromise = addLogFilterReq({
          filter: simpleFilterM,
          logViewId: logViewId,
          projectId: projectId,
        });
        toastPromise(addPromise);
        addPromise.then((res) => {
          refreshLogList();
        });
      }}
      size={"small"}
      type={"text"}
      style={{
        fontSize: "14px",
        color: "#8c8c8c",
        lineHeight: "1.57",
        borderRadius: "3px",
      }}
      icon={
        <PlusOutlined
          style={{
            position: "relative",
            top: "0px",
          }}
        />
      }
    >
      Add Filter
    </Button>
  );
}

export default FilterRowComponent;
