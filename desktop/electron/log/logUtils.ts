import { Request, Response } from "express";
import {
  getLogCollection,
  getLogViewCollection,
  getNewLogNumber,
  getProjectCollection,
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
  WebsocketStatus,
} from "livemock-core/struct/log";
import {
  getMaxRequestLogNumber,
  ProjectM,
} from "livemock-core/struct/project";
import { once } from "../util/commonUtils";
import _ from "lodash";
import { logViewEventEmitter } from "../common/eventEmitters";

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
      responseLogM.responseTime - logM.req.requestTime);
  responseLogM.headers = getResponseHeaderMap(res);
  responseLogM.body = (res as any).body;
  responseLogM.rawBody = (res as any).rawBody;
  responseLogM.status = res.statusCode;
  responseLogM.statusMessage = res.statusMessage;
  logM.res = responseLogM;
  updateLogIfPresent(logCollection, logM);
}

/**
 * Update a log unless it has already been removed (for example by a concurrent
 * trim). Loki throws when updating a document that is no longer in the
 * collection, so a racing response or websocket update must not surface as an
 * error.
 */
export function updateLogIfPresent(
  logCollection: Collection<LogM>,
  logM: LogM
): void {
  try {
    logCollection.update(logM);
  } catch (err) {
    // the log was removed after it was created (e.g. by request log trimming)
  }
}

/**
 * Remove the oldest request logs so at most `max` remain, keeping the newest.
 * Logs whose websocket is still open are never removed, since they may still be
 * updated. Returns the ids of the removed logs. The caller supplies the
 * effective max; this function applies no default or minimum of its own.
 */
export function pruneLogCollection(
  logCollection: Collection<LogM>,
  max: number
): number[] {
  const logs = logCollection.find({});
  const overflow = logs.length - max;
  if (overflow <= 0) {
    return [];
  }
  const removableLogs = logs
    .filter((log) => log.websocketInfo?.status !== WebsocketStatus.OPEN)
    .sort((a, b) => a.id - b.id)
    .slice(0, overflow);
  if (removableLogs.length === 0) {
    return [];
  }
  const removedIds = removableLogs.map((log) => log.id);
  logCollection.remove(removableLogs);
  return removedIds;
}

/**
 * Trim a project's request logs down to its effective maximum, then drop the
 * removed ids from the project's unclosed websocket bookkeeping.
 */
export async function pruneProjectLogs(
  project: ProjectM,
  path: string
): Promise<void> {
  const logCollection = await getLogCollection(project.id, path);
  const removedIds = pruneLogCollection(
    logCollection,
    getMaxRequestLogNumber(project)
  );
  if (removedIds.length === 0) {
    return;
  }
  if (project.unclosedWebsocketRequestLogIds?.length) {
    const removedIdSet = new Set(removedIds);
    const remainingIds = project.unclosedWebsocketRequestLogIds.filter(
      (id) => !removedIdSet.has(id)
    );
    if (remainingIds.length !== project.unclosedWebsocketRequestLogIds.length) {
      project.unclosedWebsocketRequestLogIds = remainingIds;
      const projectCollection = await getProjectCollection(path);
      projectCollection.update(project);
    }
  }
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
    const isNumberValue =
      !_.isArray(filter.value) && isNumberString(filter.value);
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
      case LogFilterCondition.IN:
        let inArray: Array<string | number> = [];
        (filter.value as Array<string>).forEach((element) => {
          inArray.push(element);
          if (isNumberString(element)) {
            inArray.push(Number(element));
          }
        });
        return { [filter.property]: { $in: inArray } };
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
      logViewEventEmitter.emit("delete", { id: log.id, logViewId: logView.id });
    });
  });

  return dynamicView;
}
