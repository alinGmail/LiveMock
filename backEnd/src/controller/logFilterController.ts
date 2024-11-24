import express, { Request, Response } from "express";
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
} from "livemock-core/struct/params/LogFilterParam";
import { addCross, ServerError, toAsyncRouter } from "./common";
import { getLogViewCollection } from "../db/dbManager";
import {
  AddLogFilterResponse,
  DeleteLogFilterResponse,
  UpdateLogFilterResponse,
  UpdatePresetLogFilterResponse,
} from "livemock-core/struct/response/LogFilterResponse";
import bodyParser from "body-parser";
import {
  applyDynamicViewFilter,
  getLogDynamicView,
  removeDynamicViewFilter,
} from "../log/logUtils";
import { FilterType, PresetFilterM } from "livemock-core/struct/log";
import { isEmptyArray } from "../util/arrayUtils";

export async function getLogFilterRouter(
  path: string
): Promise<express.Router> {
  async function addLogFilter(
    req: Request<
      CreateLogFilterPathParam,
      AddLogFilterResponse,
      CreateLogFilterReqBody,
      CreateLogFilterReqQuery
    >,
    res: Response<AddLogFilterResponse>
  ) {
    addCross(res);
    let { filter, logViewId, projectId } = req.body;
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
    res.json({ message: "success" });
  }

  async function updateLogFilter(
    req: Request<
      UpdateLogFilterPathParam,
      UpdateLogFilterResponse,
      UpdateLogFilterReqBody,
      UpdateLogFilterReqQuery
    >,
    res: Response<UpdateLogFilterResponse>
  ) {
    addCross(res);
    let { filter, logViewId, projectId } = req.body;
    if (!projectId) {
      throw new ServerError(400, "project id not exist!");
    }
    if (filter.id !== req.params.logFilterId) {
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
    res.json({ message: "success" });
  }

  async function updatePresetLogFilter(
    req: Request<
      UpdatePresetLogFilterPathParam,
      UpdatePresetLogFilterResponse,
      UpdatePresetLogFilterReqBody,
      UpdatePresetLogFilterReqQuery
    >,
    res: Response<UpdatePresetLogFilterResponse>
  ) {
    addCross(res);
    let { filter, logViewId, projectId } = req.body;
    if (filter.type !== FilterType.PRESET_FILTER) {
      throw new ServerError(400, "not preset filter!");
    }
    const reqFilter: PresetFilterM = filter;
    if (!projectId) {
      throw new ServerError(400, "project id not exist!");
    }
    const collection = await getLogViewCollection(projectId, path);
    const logView = collection.findOne({ id: logViewId });
    if (!logView) {
      throw new ServerError(400, "logView not exist!");
    }
    const findIndex = logView.filters.findIndex(
      (item) =>
        item.type === FilterType.PRESET_FILTER && item.name === reqFilter.name
    );

    if (reqFilter.value === null || isEmptyArray(reqFilter.value)) {
      // remove filter
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
      let presetFilter: PresetFilterM = filter;
      // update filter
      if (findIndex === -1) {
        // append to de logView
        logView.filters.push(filter);
      } else {
        presetFilter = logView.filters[findIndex] as PresetFilterM;
        presetFilter.value = filter.value;
        collection.update(logView);
      }
      const dynamicView = await getLogDynamicView(projectId, logView.id, path);
      applyDynamicViewFilter(dynamicView, presetFilter);
    }

    res.json({ message: "success" });
  }

  async function deleteLogFilter(
    req: Request<
      DeleteLogFilterPathParam,
      DeleteLogFilterResponse,
      DeleteLogFilterReqBody,
      DeleteLogFilterReqQuery
    >,
    res: Response<DeleteLogFilterResponse>
  ) {
    addCross(res);
    let { logViewId, projectId } = req.query;
    let filterId = req.params.logFilterId;
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
    res.json({ message: "success" });
  }

  let router = toAsyncRouter(express());
  router.options("*", (req, res) => {
    addCross(res);
    res.end();
  });

  /**
   * update preset filter
   */
  router.post(
    "/updatePresetLogFilter",
    bodyParser.json(),
    updatePresetLogFilter
  );

  /**
   * add log filter
   */
  router.post("/", bodyParser.json(), addLogFilter);

  /**
   * update log filter
   */
  router.post("/:logFilterId", bodyParser.json(), updateLogFilter);

  /**
   * delete log filter
   */
  router.delete("/:logFilterId", bodyParser.json(), deleteLogFilter);

  return router;
}
