import { Collection } from "lokijs";
import { ExpectationM } from "core/struct/expectation";
import {
  getDb,
  getExpectationDb,
  getLogDb,
  getLogViewDb,
} from "../db/dbManager";
import express, { Request, Response } from "express";
import { addCross, ServerError, toAsyncRouter } from "./common";
import {
  ListLogPathParam,
  ListLogReqBody,
  ListLogReqQuery,
  ListLogViewLogsParam,
  ListLogViewLogsReqBody,
  ListLogViewLogsReqQuery,
  ListLogViewParam,
  ListLogViewReqBody,
  ListLogViewReqQuery,
} from "core/struct/params/LogParams";
import { LogM } from "core/struct/log";
import { Server, Socket } from "socket.io";
import { getLogCollection } from "../log/logUtils";
import {
  ListLogViewLogsResponse,
  ListLogViewResponse,
} from "core/struct/response/LogResponse";
import { LogViewM } from "core/struct/logView";
import { logViewEventEmitter } from "../common/logViewEvent";

const PAGE_SIZE = 100;

async function getCollection(
  projectId: string,
  path: string
): Promise<Collection<LogM>> {
  const db = await getLogDb(projectId, path);
  return db.getCollection("log");
}

export async function getLogRouter(path: string): Promise<express.Router> {
  let router = toAsyncRouter(express());
  router.options("*", (req, res) => {
    addCross(res);
    res.end();
  });

  /**
   * list the log
   */
  router.get(
    "/",
    async (
      req: Request<
        ListLogPathParam,
        Array<LogM>,
        ListLogReqBody,
        ListLogReqQuery
      >,
      res: Response<Array<LogM>>
    ) => {
      addCross(res);
      const projectId = req.query.projectId;
      if (!projectId) {
        throw new ServerError(400, "project id not exist!");
      }
      const collection = await getCollection(projectId, path);
      const chain = collection.chain();
      const maxLogId = req.query.maxLogId;
      if (maxLogId === undefined || maxLogId === null) {
      } else {
        chain.find({ id: { $lt: maxLogId } });
      }
      const logs = chain
        .find({})
        .simplesort("id", { desc: true })
        .limit(PAGE_SIZE)
        .data();
      res.json(logs);
    }
  );

  /**
   * list the log view
   */
  router.get(
    "/logView",
    async (
      req: Request<
        ListLogViewParam,
        ListLogViewResponse,
        ListLogViewReqBody,
        ListLogViewReqQuery
      >,
      res: Response<ListLogViewResponse>
    ) => {
      addCross(res);
      const projectId = req.query.projectId;
      if (!projectId) {
        throw new ServerError(400, "project id not exist!");
      }
      const logViewDb = await getDb(projectId, path, "logView");
      const logViewCollection = logViewDb.getCollection("logView");
      const logViews = logViewCollection.find({});
      res.json(logViews);
    }
  );

  /**
   * get the log view logs
   */
  router.get(
    "/logViewLogs/:logViewId",
    async (
      req: Request<
        ListLogViewLogsParam,
        ListLogViewLogsResponse,
        ListLogViewLogsReqBody,
        ListLogViewLogsReqQuery
      >,
      res: Response<ListLogViewLogsResponse>
    ) => {
        let {lovViewId, maxLogId, projectId} = req.query;
        if (!projectId) {
            throw new ServerError(400, "project id not exist!");
        }
        const logViewDb = await getDb(projectId, path, "logView");
        const logViewCollection = logViewDb.getCollection<LogViewM>("logView");
        const logView = logViewCollection.findOne({});
        if(!logView){
            throw new ServerError(500, "logView did not exist!");
        }
        const logCollection = await getLogCollection(projectId, path);
        const dynamicView = logCollection.getDynamicView(logView.id);
        // todo
    }
  );

  return router;
}

export async function addLogListener(io: Server, path: string) {
  io.on("connection", async (socket) => {
    const { projectId } = socket.handshake.query;
    const logDb = await getLogDb(projectId as string, path);
    const logCollection = await getLogCollection(projectId as string, path);
    const logViewDb = await getLogViewDb(projectId as string, path);
    const logViewMCollection = logViewDb.getCollection<LogViewM>("logView");
    const logView = logViewMCollection.findOne({});
    if (!logView) {
      console.error("log view is null,projectId:" + projectId);
      return;
    }
    socket.join(logView?.id);
    //socket.on('disconnect', () => {
    // console.log(` disconnected`);
    //});
    const chain = logCollection.chain();
    const logs = chain
      .find({})
      .simplesort("id", { desc: true })
      .limit(PAGE_SIZE)
      .data();
    socket.on("initLogsReq", (args) => {
      socket.emit("initLogsRes", logs);
    });
  });
  io.on("disconnect", (socket) => {
    console.log("disconnect");
  });

  logViewEventEmitter.on("insert", (arg: { log: LogM; logViewId: string }) => {
    let { log, logViewId } = arg;
    io.to(logViewId).emit("insert", log);
  });

  logViewEventEmitter.on("update", (arg: { log: LogM; logViewId: string }) => {
    let { log, logViewId } = arg;
    io.to(logViewId).emit("update", log);
  });

  logViewEventEmitter.on("delete", (arg: { log: LogM; logViewId: string }) => {
    let { log, logViewId } = arg;
    io.to(logViewId).emit("delete", log);
  });
}
