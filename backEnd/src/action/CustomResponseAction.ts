import {
  ContentHandler,
  CustomResponseActionM,
  IAction,
  ResponseType,
} from "core/struct/action";
import express from "express";
import { delayPromise } from "./common";
import Mock from "mockjs";
import { LogM } from "core/struct/log";

class CustomResponseActionImpl implements IAction {
  action: CustomResponseActionM;
  delay: number;
  constructor(action: CustomResponseActionM, delay: number) {
    this.action = action;
    this.delay = delay;
  }

  async process(
    projectId: string,
    req: express.Request,
    res: express.Response,
    logM: LogM | undefined
  ): Promise<void> {
    if (this.delay > 0) {
      await delayPromise(this.delay);
    }
    insetProxyInfo(logM);
    if (this.action.responseContent.type === ResponseType.JSON) {
      //addCross(res);
      res.setHeader("Content-Type", "application/json");
      handleHeaders(this.action, res);
      res.status(this.action.status);

      let responseVal = getResponseContentStr(this.action);
      res.end(responseVal);
      // set the body and raw body

      try {
        (res as any).body = JSON.parse(responseVal);
      } catch (e) {}
      (res as any).rawBody = responseVal;
    } else if (this.action.responseContent.type === ResponseType.TEXT) {
      //addCross(res);
      res.setHeader("Content-Type", "text/plain");
      handleHeaders(this.action, res);
      res.status(this.action.status);
      let responseVal = getResponseContentStr(this.action);
      res.end(responseVal);
      (res as any).body = responseVal;
      (res as any).rawBody = responseVal;
    }
  }
}

function getResponseContentStr(action: CustomResponseActionM): string {
  let responseVal = action.responseContent.value;
  if (action.responseContent.contentHandler === ContentHandler.MOCK_JS) {
    responseVal = Mock.mock(JSON.parse(action.responseContent.value));
    responseVal = JSON.stringify(responseVal);
  }
  return responseVal;
}

function insetProxyInfo(log: LogM | undefined) {
  if (!log) {
    return;
  }
  log.proxyInfo = {
    isProxy: false,
    proxyHost: null,
    proxyPath: null,
    requestHeaders: [],
    responseHeaders: [],
  };
}

function handleHeaders(action: CustomResponseActionM, res: express.Response) {
  action.responseContent.headers.forEach((headers) => {
    if (headers[0].trim() !== "") {
      res.setHeader(headers[0], headers[1]);
    }
  });
}

export { CustomResponseActionImpl };
