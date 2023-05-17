import { Request, Response } from "express";
import { getLogDb } from "../db/dbManager";
import { Collection } from "lokijs";
import { createLog, createRequestLog, LogM } from "core/struct/log";

export async function getLogCollection(
  projectId: string,
  path: string
): Promise<Collection<LogM>> {
  const logDb = await getLogDb(projectId, path);
  return logDb.getCollection("log");
}

export function insertReqLog(
  logCollection: Collection<LogM>,
  req: Request,
  res: Response,
  expectationId: string
) {
  const logM = createLog();
  logM.expectationId = expectationId;

  const requestLogM = createRequestLog();
  requestLogM.path = req.path;
  requestLogM.body = req.body;
  // @ts-ignore
  requestLogM.rawBody = req.rawBody;
  requestLogM.headers = req.rawHeaders.reduce((acc, current, index, array) => {
    if (index % 2 === 0) {
      acc[current.toLowerCase()] = array[index + 1];
    }
    return acc;
  }, {});
  requestLogM.method = req.method;
  logCollection.insert(logM);
  // requestLogM.headers = req.headers;
}
