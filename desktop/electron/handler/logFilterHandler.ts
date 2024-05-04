import * as electron from "electron";
import { LogFilterEvents } from "core/struct/events/desktopEvents";
import {
  CreateLogFilterPathParam,
  CreateLogFilterReqBody,
  CreateLogFilterReqQuery,
  DeleteLogFilterPathParam,
  DeleteLogFilterReqBody,
  DeleteLogFilterReqQuery,
  UpdateLogFilterPathParam,
  UpdateLogFilterReqBody,
  UpdateLogFilterReqQuery,
  UpdatePresetLogFilterPathParam,
  UpdatePresetLogFilterReqBody,
  UpdatePresetLogFilterReqQuery,
} from "core/struct/params/LogFilterParam";
import { ServerError } from "./common";
import { getLogViewCollection } from "../db/dbManager";
import {
  applyDynamicViewFilter,
  getLogDynamicView,
  removeDynamicViewFilter,
} from "../log/logUtils";
import { FilterType, PresetFilterM } from "core/struct/log";
import ipcMain = electron.ipcMain;

export async function setLogFilterHandler(path: string): Promise<void> {
  ipcMain.handle(
    LogFilterEvents.CreateLogFilter,
    async (
      event,
      reqParam: CreateLogFilterPathParam,
      reqQuery: CreateLogFilterReqQuery,
      reqBody: CreateLogFilterReqBody
    ) => {
      let { filter, logViewId, projectId } = reqBody;
      if (!projectId) {
        throw new ServerError(400, "project id not exist!");
      }
      const collection = await getLogViewCollection(projectId, path);
      const logView = collection.findOne({ id: logViewId });
      if (!logView) {
        throw new ServerError(400, "logView not exist!");
      }
      logView.filters.push(filter);
      const dynamicView = await getLogDynamicView(projectId, logView.id, path);
      applyDynamicViewFilter(dynamicView, filter);
      return { message: "success" };
    }
  );
  ipcMain.handle(
    LogFilterEvents.UpdateLogFilter,
    async (
      event,
      reqParam: UpdateLogFilterPathParam,
      reqQuery: UpdateLogFilterReqQuery,
      reqBody: UpdateLogFilterReqBody
    ) => {
      let { filter, logViewId, projectId } = reqBody;
      if (!projectId) {
        throw new ServerError(400, "project id not exist!");
      }
      if (filter.id !== reqParam.logFilterId) {
        throw new ServerError(400, "invalid param");
      }
      const collection = await getLogViewCollection(projectId, path);
      const logView = collection.findOne({ id: logViewId });
      if (!logView) {
        throw new ServerError(400, "logView not exist!");
      }
      const findIndex = logView.filters.findIndex(
        (item) => item.id === filter.id
      );
      if (findIndex === -1) {
        throw new ServerError(400, "filter not exist!");
      }
      logView.filters[findIndex] = filter;
      collection.update(logView);
      const dynamicView = await getLogDynamicView(projectId, logView.id, path);
      applyDynamicViewFilter(dynamicView, filter);
      return { message: "success" };
    }
  );
  ipcMain.handle(
    LogFilterEvents.DeleteLogFilter,
    async (
      event,
      reqParam: DeleteLogFilterPathParam,
      reqQuery: DeleteLogFilterReqQuery,
      reqBody: DeleteLogFilterReqBody
    ) => {
      let { logViewId, projectId } = reqQuery;
      let filterId = reqParam.logFilterId;
      if (!projectId) {
        throw new ServerError(400, "project id not exist!");
      }
      const collection = await getLogViewCollection(projectId, path);
      const logView = collection.findOne({ id: logViewId });
      if (!logView) {
        throw new ServerError(400, "logView not exist!");
      }
      logView.filters = logView.filters.filter((item) => item.id !== filterId);
      collection.update(logView);
      const dynamicView = await getLogDynamicView(projectId, logView.id, path);
      removeDynamicViewFilter(dynamicView, filterId);
      return { message: "success" };
    }
  );

  ipcMain.handle(
    LogFilterEvents.UpdatePresetLogFilter,
    async (
      event,
      reqParam: UpdatePresetLogFilterPathParam,
      reqQuery: UpdatePresetLogFilterReqQuery,
      reqBody: UpdatePresetLogFilterReqBody
    ) => {
      let { filter, projectId, logViewId } = reqBody;
      if (filter.type !== FilterType.PRESET_FILTER) {
        throw new ServerError(400, "not preset filter!");
      }
      const reqFilter: PresetFilterM = filter as PresetFilterM;
      if (!projectId) {
        throw new ServerError(400, "project id not exist!");
      }
      const collection = await getLogViewCollection(projectId, path);
      const logView = collection.findOne({ id: logViewId });
      if (!logView) {
        throw new ServerError(400, "logView not exist!");
      }
      const findIndex = logView.filters.findIndex((item) => {
        return (
          item.type === FilterType.PRESET_FILTER && item.name === reqFilter.name
        );
      });

      if (reqFilter.value === null) {
        // remove the filter
        if (findIndex !== -1) {
          const presetFilter = logView.filters[findIndex];
          logView.filters = logView.filters.filter(
            (item) => item.id !== presetFilter.id
          );
          collection.update(logView);
          const dynamicView = await getLogDynamicView(
            projectId,
            logView.id,
            path
          );
          removeDynamicViewFilter(dynamicView, presetFilter.id);
        }
      } else {
        let presetFilter: PresetFilterM = reqFilter;
        if (findIndex === -1) {
          logView.filters.push(filter);
        } else {
          presetFilter = logView.filters[findIndex] as PresetFilterM;
          presetFilter.value = reqFilter.value;
          collection.update(logView);
        }
        const dynamicView = await getLogDynamicView(
          projectId,
          logView.id,
          path
        );
        applyDynamicViewFilter(dynamicView, presetFilter);
      }
      return { message: "success" };
    }
  );
}
