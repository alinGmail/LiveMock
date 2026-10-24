import express from "express";
import path from "path";
import fs from "fs";
import { getApiRouter } from "./apiRouter";
import { addLogListener } from "./controller/logController";
import { getSystemCollection } from "./db/dbManager";
import { sysEventEmitter } from "./common/eventEmitters";
import { SystemEvent } from "livemock-core/struct/events/systemEvent";
import { addWsEventListeners } from "./common/eventListener";
import { getConfig } from "./config/config";
import { RESET_ADMIN_COMMAND, runResetAdminCli } from "./script/resetAdmin";
import { applyTrustProxy } from "./auth/trustProxy";
import { createSocketAuthMiddleware } from "./auth/socketAuth";
import {
  sweepExpiredApiTokens,
  sweepExpiredSessions,
} from "./auth/authStore";
import { pruneAllProjects, startLogPruneTask } from "./log/logPruneTask";

export const systemVersion = 801;

// `livemock reset-admin <username>` resets the account instead of starting the
// server. Nothing the server needs (Express, Socket.IO, the database managers)
// may be set up before this check, so the reset is written to a stopped
// database.
if (process.argv[2] === RESET_ADMIN_COMMAND) {
  runResetAdminCli(process.argv.slice(3)).catch((error) => {
    process.stderr.write(`${error.message}\n`, () => process.exit(1));
  });
} else {
  startServer();
}

function startServer() {
  const { Server } = require("socket.io");

  const server = express();
  applyTrustProxy(server);
  const http = require("http").Server(server);
  const io = new Server(http, {
    path: "/api/socket.io",
  });

  const config = getConfig();
  const dbPath = config.database.path;

  io.use(createSocketAuthMiddleware(dbPath));

  // housekeeping: drop sessions that expired without being used again
  const sessionSweep = setInterval(() => {
    sweepExpiredSessions(dbPath).catch(() => undefined);
    sweepExpiredApiTokens(dbPath).catch(() => undefined);
  }, 60 * 60 * 1000);
  sessionSweep.unref();

  sysEventEmitter.on(SystemEvent.START, async () => {
    const systemCollection = await getSystemCollection(dbPath);
    const systemConfig = systemCollection.findOne({});
    if (systemConfig) {
    } else {
      systemCollection.insertOne({ version: systemVersion });
    }
  });

  // trim request logs over each project's configured maximum, once at boot and
  // then on a timer
  sysEventEmitter.on(SystemEvent.START, async () => {
    try {
      await pruneAllProjects(dbPath);
    } catch (err) {
      console.error(err);
    }
    startLogPruneTask(dbPath);
  });

  addWsEventListeners();

  (async function () {
    // wait all start event finish
    await Promise.all(
      sysEventEmitter.listeners(SystemEvent.START).map((listener) => listener())
    );

    const apiRouter = await getApiRouter(dbPath);
    server.use("/api", apiRouter);
    // Served next to the bundle in an npm install (`dist/dashboard`), or from the
    // sibling frontEnd workspace during ts-node development.
    const dashboardDir =
      process.env.LIVEMOCK_STATIC_DIR ||
      (fs.existsSync(path.join(__dirname, "dashboard"))
        ? path.join(__dirname, "dashboard")
        : path.resolve(process.cwd(), "../frontEnd/dist"));
    server.use("/dashboard", express.static(dashboardDir));
    server.all("/", (req, res) => {
      res.redirect("/dashboard");
    });
    await addLogListener(io, dbPath);

    const port = Number(process.env.LIVEMOCK_PORT) || 9002;
    http.listen(port, () => {
      console.log(`server start on ${port}`);
    });
  })();
}

process.on("uncaughtException", (err) => {
  console.error("Uncaught Exception:", err);
});
