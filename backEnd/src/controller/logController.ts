import { Collection } from "lokijs";
import { ExpectationM } from "livemock-core/struct/expectation";
import {
  getExpectationDb,
  getLogCollection,
  getLogDb,
  getLogViewCollection,
  getLogViewDb,
} from "../db/dbManager";
import express, { Request, Response } from "express";
import { addCross, ServerError, toAsyncRouter } from "./common";
import {
  DeleteAllRequestLogsPathParam,
  DeleteAllRequestLogsReqBody,
  DeleteAllRequestLogsReqQuery,
  ListLogPathParam,
  ListLogReqBody,
  ListLogReqQuery,
  ListLogViewLogsPathParam,
  ListLogViewLogsReqBody,
  ListLogViewLogsReqQuery,
  ListLogViewPathParam,
  ListLogViewReqBody,
  ListLogViewReqQuery,
} from "livemock-core/struct/params/LogParams";
import { LogM } from "livemock-core/struct/log";
import { Server, Socket } from "socket.io";
import {
  DeleteAllRequestLogsResponse,
  ListLogViewLogsResponse,
  ListLogViewResponse,
} from "livemock-core/struct/response/LogResponse";
import { logEventEmitter, logViewEventEmitter } from "../common/eventEmitters";
import { getLogDynamicView } from "../log/logUtils";
import console from "console";

const PAGE_SIZE = 100;

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
      const collection = await getLogCollection(projectId, path);
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
        ListLogViewPathParam,
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

      const logViewCollection = await getLogViewCollection(projectId, path);
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
        ListLogViewLogsPathParam,
        ListLogViewLogsResponse,
        ListLogViewLogsReqBody,
        ListLogViewLogsReqQuery
      >,
      res: Response<ListLogViewLogsResponse>
    ) => {
      addCross(res);
      let { maxLogId, projectId } = req.query;
      const lovViewId = req.params.logViewId;
      if (!projectId) {
        throw new ServerError(400, "project id not exist!");
      }
      const logViewCollection = await getLogViewCollection(projectId, path);
      const logView = logViewCollection.findOne({ id: lovViewId });
      if (!logView) {
        throw new ServerError(500, "logView did not exist!");
      }
      const logCollection = await getLogCollection(projectId, path);
      const dynamicView = await getLogDynamicView(projectId, logView.id, path);

      let resultset = dynamicView.branchResultset(); //.limit(PAGE_SIZE).data();
      if (maxLogId === undefined || maxLogId === null || maxLogId === "") {
      } else {
        resultset = resultset.find({ id: { $lt: maxLogId } });
      }
      const logs = resultset
        .simplesort("id", { desc: true })
        .limit(PAGE_SIZE)
        .data();
      res.json(logs);
    }
  );

  router.delete(
    "/",
    async (
      req: Request<
        DeleteAllRequestLogsPathParam,
        DeleteAllRequestLogsResponse,
        DeleteAllRequestLogsReqBody,
        DeleteAllRequestLogsReqQuery
      >,
      res: Response<DeleteAllRequestLogsResponse>
    ) => {
      addCross(res);
      let { projectId } = req.query;
      if (!projectId) {
        throw new ServerError(400, "project id not exist!");
      }
      const logCollection = await getLogCollection(projectId, path);
      logCollection.findAndRemove({});
      res.json({ message: "success" });
    }
  );

  return router;
}

export async function addLogListener(io: Server, path: string) {
  io.on("connection", async (socket) => {
    const { projectId } = socket.handshake.query;
    const logDb = await getLogDb(projectId as string, path);
    const logCollection = await getLogCollection(projectId as string, path);
    const logViewMCollection = await getLogViewCollection(
      projectId as string,
      path
    );
    const logView = logViewMCollection.findOne({});
    if (!logView) {
      console.error("log view is null,projectId:" + projectId);
      return;
    }
    socket.join(`logView:${logView.id}`);
    const chain = logCollection.chain();
    const logs = chain
      .find({})
      .simplesort("id", { desc: true })
      .limit(PAGE_SIZE)
      .data();
    socket.on("initLogsReq", (args) => {
      socket.emit("initLogsRes", logs);
    });

    socket.on("join_log_update", (logId: number) => {
      socket.join(`log:${projectId}:${logId}`);
    });
    socket.on("leave_log_update", (logId: number) => {
      socket.leave(`log:${projectId}:${logId}`);
    });

    socket.on("disconnect", () => {
      socket.leave(`logView:${logView.id}`);
    });
  });

  logViewEventEmitter.on("insert", (arg: { log: LogM; logViewId: string }) => {
    let { log, logViewId } = arg;
    io.to(`logView:${logViewId}`).emit("insert", { log, logViewId });
  });

  logViewEventEmitter.on("update", (arg: { log: LogM; logViewId: string }) => {
    let { log, logViewId } = arg;
    io.to(`logView:${logViewId}`).emit("update", { log, logViewId });
  });

  logViewEventEmitter.on("delete", (arg: { log: LogM; logViewId: string }) => {
    let { log, logViewId } = arg;
    io.to(`logView:${logViewId}`).emit("delete", { log, logViewId });
  });

  logViewEventEmitter.on(
    "updateExpectation",
    (arg: { projectId: string; expectation: ExpectationM }) => {
      let { projectId, expectation } = arg;
      io.emit("updateExpectation", { projectId, expectation });
    }
  );

  logEventEmitter.on(
    "update",
    (args: { projectId: string; log: LogM; oldLog: LogM }) => {
      let { projectId, log, oldLog } = args;
      io.to(`log:${projectId}:${log.id}`).emit("updateLog", { log, projectId });
    }
  );
}
