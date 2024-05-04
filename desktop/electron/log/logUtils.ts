import { Request, Response } from "express";
import {
  getLogCollection,
  getLogViewCollection,
  getNewLogNumber,
} from "../db/dbManager";
import { Collection } from "lokijs";
import {
  createLog,
  createRequestLog,
  createResponseLog,
  FilterType,
  LogFilterCondition,
  LogFilterM,
  LogM,
} from "core/struct/log";
import { logViewEventEmitter } from "../common/logViewEvent";
import { once } from "../util/commonUtils";

export function insertReqLog(
  logCollection: Collection<LogM>,
  req: Request,
  res: Response,
  expectationId: string,
  projectId: string,
  path: string
): LogM | undefined {
  const logM = createLog(getNewLogNumber(projectId, path));
  logM.expectationId = expectationId;

  const requestLogM = createRequestLog();
  requestLogM.path = req.path;
  requestLogM.body = req.body;
  // @ts-ignore
  requestLogM.rawBody = req.rawBody;
  requestLogM.query = req.query;
  requestLogM.headers = req.rawHeaders.reduce(
    (header, current, index, array) => {
      if (index % 2 === 0) {
        header[current.toLowerCase()] = array[index + 1];
      }
      return header;
    },
    {}
  );
  requestLogM.method = req.method;
  logM.req = requestLogM;
  return logCollection.insert(logM);
}

export function insertResLog(
  logCollection: Collection<LogM>,
  req: Request,
  res: Response,
  expectationId: string,
  logM: LogM
) {
  // get the res
  const responseLogM = createResponseLog();
  logM.req &&
    (responseLogM.duration =
      responseLogM.responseDate.getTime() - logM.req.requestDate.getTime());
  responseLogM.headers = getResponseHeaderMap(res);
  responseLogM.body = (res as any).body;
  responseLogM.rawBody = (res as any).rawBody;
  responseLogM.status = res.statusCode;
  responseLogM.statusMessage = res.statusMessage;
  logM.res = responseLogM;
  logCollection.update(logM);
}

export function getResponseHeaderMap(res: Response): {
  [key: string]: string;
} {
  let names = res.getHeaderNames();
  let headers = {};
  names.forEach((name) => {
    let header = res.getHeader(name);
    switch (typeof header) {
      case "number":
        headers[name] = header + "";
        break;
      case "string":
        headers[name] = header;
        break;
      case "undefined":
        headers[name] = "";
        break;
      case "object":
        headers[name] = header.join(", ");
        break;
    }
  });
  return headers;
}
function isNumberString(value: string) {
  if (value == null) {
    return false;
  }
  const numVal = Number(value);
  return !isNaN(numVal);
}
// change filter to mongo-style query
export function changeToLokijsFilter(filter: LogFilterM) {
  if (
    filter.type === FilterType.SIMPLE_FILTER ||
    filter.type === FilterType.PRESET_FILTER
  ) {
    const isNumberValue = isNumberString(filter.value);
    switch (filter.condition) {
      case LogFilterCondition.EQUAL:
        return {
          [filter.property]: {
            // abstract (loose) equality
            $aeq: filter.value,
          },
        };
      case LogFilterCondition.NOT_EQUAL:
        if (isNumberValue) {
          return {
            $and: [
              {
                [filter.property]: {
                  $ne: filter.value,
                },
              },
              {
                [filter.property]: {
                  $ne: Number(filter.value),
                },
              },
            ],
          };
        }
        return {
          [filter.property]: {
            $ne: filter.value,
          },
        };
      case LogFilterCondition.CONTAINS:
        return { [filter.property]: { $contains: filter.value } };
      case LogFilterCondition.GREATER:
        return { [filter.property]: { $gt: filter.value } };
      case LogFilterCondition.LESS:
        return { [filter.property]: { $lt: filter.value } };
    }
  } else {
    // todo
  }
}

export function applyDynamicViewFilter(
  dynamicView: DynamicView<LogM>,
  filter: LogFilterM
) {
  const applyFilter = changeToLokijsFilter(filter);
  dynamicView.applyFind(applyFilter, filter.id);
}
export function removeDynamicViewFilter(
  dynamicView: DynamicView<LogM>,
  filterId: string
) {
  dynamicView.removeFilter(filterId);
}

export async function getLogDynamicView(
  projectId: string,
  viewId: string,
  path: string
) {
  const logViewCollection = await getLogViewCollection(projectId, path);
  const logCollection = await getLogCollection(projectId, path);
  const logView = logViewCollection.findOne({ id: viewId });
  let dynamicView = logCollection.getDynamicView(viewId);
  if (!logView) {
    throw new Error("");
  }
  if (dynamicView === null) {
    // init the dynamicView
    dynamicView = logCollection.addDynamicView(viewId);
    dynamicView.applyFind({});
    dynamicView.applySimpleSort("id", { desc: true });
  }

  once(viewId, () => {
    if (!dynamicView) {
      return;
    }
    // sync the logView filter and dynamicView filterPipeline
    logView.filters.forEach((filter) => {
      const find = dynamicView!.filterPipeline.find((pipeLine) => {
        return pipeLine.uid === filter.id;
      });
      if (!find) {
        applyDynamicViewFilter(dynamicView!, filter);
      }
    });
    dynamicView.filterPipeline.forEach((pipeLine) => {
      const find = logView.filters.find((filter) => {
        return filter.id === pipeLine.uid;
      });
      if (!find && pipeLine.uid) {
        dynamicView?.removeFilter(pipeLine.uid);
      }
    });

    dynamicView.on("insert", (log: LogM) => {
      logViewEventEmitter.emit("insert", { log, logViewId: logView.id });
    });
    dynamicView.on("update", (log: LogM) => {
      logViewEventEmitter.emit("update", { log, logViewId: logView.id });
    });
    dynamicView.on("delete", (log: LogM) => {
      logViewEventEmitter.emit("delete", { log, logViewId: logView.id });
    });
  });

  return dynamicView;
}
