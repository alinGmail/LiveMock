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
import {createExpectationPresetFilterM} from "core/struct/log";

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
  const presetFilterState = useAppSelector((state) => state.log.presetFilter);
  const dispatch = useDispatch();
  return (
    <div style={{
      display:'flex',
      alignItems:"center",
    }}>
      <div>
        <span style={{
          paddingRight:"8px",
        }}>expectation:</span>
        <Select
          allowClear={true}
          value={presetFilterState.expectationId}
          style={{
            width: "150px",
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
            }).then((res) => {
              refreshLogList();
            });
            toastPromise(updatePromise);
          }}
        />
      </div>
    </div>
  );
};

export default PresetFilterRowComponent;
