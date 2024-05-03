import React from "react";
import mStyle from "./FilterRowComponent.module.scss";
import LogFilterComponent from "./LogFilterComponent";
import {
  addLogFilter,
  LogState,
  updatePresetFilter,
} from "../../slice/logSlice";
import { ProjectM } from "core/build/struct/project";
import { useDispatch } from "react-redux";
import { App, Button, Select } from "antd";
import {
  createExpectationPresetFilterM,
  createSimpleFilter,
} from "core/struct/log";
import {
  addLogFilterReq,
  updatePresetLogFilterReq,
} from "../../server/logFilterServer";
import { toastPromise } from "../common";
import { ClearOutlined, PlusOutlined } from "@ant-design/icons";
import { UseQueryResult } from "@tanstack/react-query";
import { ListLogViewResponse } from "core/struct/response/LogResponse";
import { deleteAllRequestLogs } from "../../server/logServer";
import { ListExpectationResponse } from "core/build/struct/response/ExpectationResponse";
import { useAppSelector } from "../../store";

const FilterRowComponent: React.FunctionComponent<{
  logViewId: string | undefined;
  logState: LogState;
  currentProject: ProjectM;
  refreshLogList: () => void;
  getLogViewQuery: UseQueryResult<ListLogViewResponse>;
  getExpectationListQuery: UseQueryResult<ListExpectationResponse>;
}> = ({
  logViewId,
  logState,
  currentProject,
  refreshLogList,
  getLogViewQuery,
  getExpectationListQuery,
}) => {
  const { modal } = App.useApp();
  const presetFilterState = useAppSelector((state) => state.log.presetFilter);
  const dispatch = useDispatch();
  return (
    <div>
      <div>
        handle by expectation:&nbsp;
        <Select
          allowClear={true}
          value={presetFilterState.expectationId}
          style={{
            width: "200px",
          }}
          loading={getExpectationListQuery.isLoading}
          options={getExpectationListQuery.data?.map((item) => {
            return {
              label: item.name,
              value: item.id,
            };
          })}
          onChange={(value) => {
            dispatch(updatePresetFilter({ expectationId: value }));
            const filter = createExpectationPresetFilterM();
            filter.value = value ?? null;

            const updatePromise = updatePresetLogFilterReq({
              projectId: currentProject.id,
              logViewId: logViewId ?? "",
              filter: filter,
            }).then(res => {
              refreshLogList();
            });
            toastPromise(updatePromise);
          }}
        />
      </div>
      <div className={mStyle.filterRow}>
        <div className={mStyle.filterCol}>
          custom filter:
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
          <Button
            type={"text"}
            title={"delete all"}
            shape={"circle"}
            icon={<ClearOutlined />}
            onClick={() => {
              modal.confirm({
                content: "Are you sure to delete all the request log?",
                title: "warning",
                type: "warning",
                onOk: () => {
                  const deletePromise = deleteAllRequestLogs({
                    projectId: currentProject.id,
                  });
                  toastPromise(deletePromise);
                  deletePromise
                    .then((res) => {
                      refreshLogList();
                    })
                    .catch((e) => {
                      return;
                    });
                },
              });
            }}
          />
        </div>
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
