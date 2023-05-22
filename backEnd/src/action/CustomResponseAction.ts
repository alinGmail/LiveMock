import { CustomResponseActionM, IAction, ResponseType } from "core/struct/action";
import express from "express";
import {delayPromise} from "./common";

class CustomResponseActionImpl implements IAction {
  action: CustomResponseActionM;
  delay: number;
  constructor(
    action: CustomResponseActionM,
    delay: number
  ) {
    this.action = action;
    this.delay = delay;
  }

  async process(req: express.Request, res: express.Response): Promise<void> {

    if (this.delay > 0) {
      await delayPromise(this.delay);
    }
    if (this.action.responseContent.type === ResponseType.JSON) {
      //addCross(res);
      res.setHeader("Content-Type", "application/json");
      handleHeaders(this.action, res);
      res.status(this.action.status);
      const responseVal = this.action.responseContent.value;
      res.end(responseVal);
      // set the body and raw body
      (res as any).body = JSON.parse(responseVal);
      (res as any).rawBody = responseVal;
    } else if (this.action.responseContent.type === ResponseType.TEXT) {
      //addCross(res);
      res.setHeader("Content-Type", "text/plain");
      handleHeaders(this.action, res);
      res.status(this.action.status);
      const responseVal = this.action.responseContent.value;
      res.end(responseVal);
      (res as any).body = responseVal;
      (res as any).rawBody = responseVal;
    }
  }
}

function handleHeaders(action: CustomResponseActionM, res: express.Response) {
  action.responseContent.headers.forEach((headers) => {
    if (headers[0].trim() !== "") {
      res.setHeader(headers[0], headers[1]);
    }
  });
}



export { CustomResponseActionImpl };
