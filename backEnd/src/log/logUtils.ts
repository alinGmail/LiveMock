import { Request, Response } from "express";
import { getNewLogNumber} from "../db/dbManager";
import { Collection } from "lokijs";
import {createLog, createRequestLog, createResponseLog, LogM} from "core/struct/log";




export function insertReqLog(
  logCollection: Collection<LogM>,
  req: Request,
  res: Response,
  expectationId: string,
  projectId:string,
  path:string,
):LogM | undefined {
  const logM = createLog(getNewLogNumber(projectId,path));
  logM.expectationId = expectationId;

  const requestLogM = createRequestLog();
  requestLogM.path = req.baseUrl;
  requestLogM.body = req.body;
  // @ts-ignore
  requestLogM.rawBody = req.rawBody;
  requestLogM.headers = req.rawHeaders.reduce((header, current, index, array) => {
    if (index % 2 === 0) {
      header[current.toLowerCase()] = array[index + 1];
    }
    return header;
  }, {});
  requestLogM.method = req.method;
  logM.req = requestLogM;
  return logCollection.insert(logM);
}


export function insertResLog(
    logCollection:Collection<LogM>,
    req:Request,
    res:Response,
    expectationId:string,
    logM:LogM,
){
  // get the res
  const responseLogM = createResponseLog();
  logM.req && (responseLogM.duration =
      responseLogM.responseDate.getTime() - logM.req.requestDate.getTime() );
  responseLogM.headers = getResponseHeaderMap(res);
  responseLogM.body = (res as any).body;
  responseLogM.rawBody = (res as any).rawBody;
  responseLogM.status = res.statusCode;
  responseLogM.statusMessage = res.statusMessage;
  logM.res = responseLogM;
  logCollection.update(logM);
}


export function getResponseHeaderMap(res:Response):{
  [key :string]:string;
}{
  let names = res.getHeaderNames();
  let headers ={};
  names.forEach(name=>{
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