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
      res.end(this.action.responseContent.value);
    } else if (this.action.responseContent.type === ResponseType.TEXT) {
      //addCross(res);
      res.setHeader("Content-Type", "text/plain");
      handleHeaders(this.action, res);
      res.status(this.action.status);
      res.end(this.action.responseContent.value);
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
