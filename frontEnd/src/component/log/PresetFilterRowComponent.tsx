import React from "react";
import { Select } from "antd";
import { LogState, updatePresetFilter } from "../../slice/logSlice";
import { updatePresetLogFilterReq } from "../../server/logFilterServer";
import { toastPromise } from "../common";
import { ProjectM } from "core/struct/project";
import { UseQueryResult } from "@tanstack/react-query";
import { ListLogViewResponse } from "core/struct/response/LogResponse";
import { ListExpectationResponse } from "core/struct/response/ExpectationResponse";
import { useAppSelector } from "../../store";
import { useDispatch } from "react-redux";
import {
  createExpectationPresetFilterM,
  createMethodsPresetFilterM,
  createStatusCodePresetFilterM,
} from "core/struct/log";

const ExpectationPresetFilter: React.FunctionComponent<{
  refreshLogList: () => void;
  logViewId: string | undefined;
  currentProject: ProjectM;
  getExpectationListQuery: UseQueryResult<ListExpectationResponse>;
}> = ({
  logViewId,
  currentProject,
  getExpectationListQuery,
  refreshLogList,
}) => {
  const presetFilterState = useAppSelector((state) => state.log.presetFilter);
  const dispatch = useDispatch();
  return (
    <div>
      <div
        style={{
          paddingRight: "8px",
          fontSize: "18px",
          verticalAlign: "center",
          fontFamily: "Arial",
        }}
      >
        expectation:
      </div>
      <Select
        size={"small"}
        allowClear={true}
        value={presetFilterState.expectationId}
        style={{
          width: "150px",
        }}
        loading={getExpectationListQuery.isLoading}
        options={getExpectationListQuery.data?.map((item) => {
          return {
            label: item.name ? item.name : item.id,
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
          }).then((res) => {
            refreshLogList();
          });
          toastPromise(updatePromise);
        }}
      />
    </div>
  );
};

const MethodPresetFilter: React.FunctionComponent<{
  refreshLogList: () => void;
  logViewId: string | undefined;
  currentProject: ProjectM;
}> = ({ logViewId, refreshLogList, currentProject }) => {
  const presetFilterState = useAppSelector((state) => state.log.presetFilter);
  const dispatch = useDispatch();
  return (
    <div>
      <div
        style={{
          width: "200px",
        }}
      >
        <div
          style={{
            paddingRight: "8px",
            fontSize: "18px",
            verticalAlign: "center",
            fontFamily: "Arial",
          }}
        >
          methods:
        </div>
        <Select
          size="small"
          mode="tags"
          allowClear={true}
          value={presetFilterState.methods}
          style={{ width: "100%" }}
          placeholder="search or input methods"
          onChange={(value) => {
            dispatch(updatePresetFilter({ methods: value }));
            const filter = createMethodsPresetFilterM();
            filter.value = value;
            const updatePromise = updatePresetLogFilterReq({
              projectId: currentProject.id,
              logViewId: logViewId ?? "",
              filter: filter,
            }).then((res) => {
              refreshLogList();
            });
            toastPromise(updatePromise);
          }}
          options={[
            {
              value: "GET",
              label: "GET",
            },
            {
              value: "POST",
              label: "POST",
            },
            {
              value: "DELETE",
              label: "DELETE",
            },
            {
              value: "PUT",
              label: "PUT",
            },
          ]}
        />
      </div>
    </div>
  );
};

const StatusCodePresetFilter: React.FunctionComponent<{
  refreshLogList: () => void;
  logViewId: string | undefined;
  currentProject: ProjectM;
}> = ({ logViewId, refreshLogList, currentProject }) => {
  const presetFilterState = useAppSelector((state) => state.log.presetFilter);
  const dispatch = useDispatch();
  return (
    <div
      style={{
        width: "200px",
      }}
    >
      <div
        style={{
          paddingRight: "8px",
          fontSize: "18px",
          verticalAlign: "center",
          fontFamily: "Arial",
        }}
      >
        status code:
      </div>
      <Select
        value={presetFilterState.statusCode}
        size="small"
        mode="tags"
        style={{ width: "100%" }}
        placeholder="input status code"
        onChange={(value) => {
          console.log(value);
          dispatch(
            updatePresetFilter({
              statusCode: value,
            })
          );
          const filter = createStatusCodePresetFilterM();
          filter.value = value.map((item) => parseInt(item));
          const updatePromise = updatePresetLogFilterReq({
            projectId: currentProject.id,
            logViewId: logViewId ?? "",
            filter: filter,
          }).then((res) => {
            refreshLogList();
          });
          toastPromise(updatePromise);
        }}
      ></Select>
    </div>
  );
};

const PresetFilterRowComponent: React.FunctionComponent<{
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
  return (
    <div
      style={{
        marginBottom: "10px",
      }}
    >
      <div
        style={{
          fontWeight: "600",
          marginRight: "10px",
          fontSize: "12px",
          color: "#999",
        }}
      >
        FILTERS:
      </div>
      <div
        style={{
          display: "flex",
          alignItems: "center",
        }}
      >
        <ExpectationPresetFilter
          refreshLogList={refreshLogList}
          logViewId={logViewId}
          currentProject={currentProject}
          getExpectationListQuery={getExpectationListQuery}
        />
        <MethodPresetFilter
          refreshLogList={refreshLogList}
          logViewId={logViewId}
          currentProject={currentProject}
        />
        <StatusCodePresetFilter
          refreshLogList={refreshLogList}
          logViewId={logViewId}
          currentProject={currentProject}
        />
      </div>
    </div>
  );
};

export default PresetFilterRowComponent;
