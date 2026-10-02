import express from "express";
import { getProjectRouter } from "./controller/projectController";
import { getExpectationRouter } from "./controller/expectationController";
import { CustomErrorMiddleware } from "./controller/common";
import { getMatcherRouter } from "./controller/matcherController";
import { getActionRouter } from "./controller/actionController";
import { addLogListener, getLogRouter } from "./controller/logController";
import { getLogFilterRouter } from "./controller/logFilterController";
import { getSystemCollection } from "./db/dbManager";
import { sysEventEmitter } from "./common/eventEmitters";
import { SystemEvent } from "livemock-core/struct/events/systemEvent";
import { addWsEventListeners } from "./common/eventListener";
import { getConfig } from "./config/config";

const { Server } = require("socket.io");

const server = express();
const http = require("http").Server(server);
const corsOrigins = (process.env.CORS_ORIGIN || "http://localhost:5173")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);
const io = new Server(http, {
  cors: {
    origin: corsOrigins,
  },
});
export const systemVersion = 801;

const config = getConfig();
const dbPath = config.database.path;

sysEventEmitter.on(SystemEvent.START, async () => {
  const systemCollection = await getSystemCollection(dbPath);
  const systemConfig = systemCollection.findOne({});
  if (systemConfig) {
  } else {
    systemCollection.insertOne({ version: systemVersion });
  }
});

addWsEventListeners();

(async function () {
  // wait all start event finish
  await Promise.all(
    sysEventEmitter.listeners(SystemEvent.START).map((listener) => listener())
  );

  server.use("/project", await getProjectRouter(dbPath));
  server.use("/expectation", getExpectationRouter(dbPath));
  server.use("/matcher", getMatcherRouter(dbPath));
  server.use("/action", await getActionRouter(dbPath));
  server.use("/logFilter", await getLogFilterRouter(dbPath));
  server.use("/log", await getLogRouter(dbPath));
  server.use("/dashboard", express.static("../frontEnd/dist"));
  server.all("/", (req, res) => {
    res.redirect("/dashboard");
  });
  await addLogListener(io, dbPath);

  server.use(CustomErrorMiddleware);
  const port = Number(process.env.LIVEMOCK_PORT) || 9002;
  http.listen(port, () => {
    console.log(`server start on ${port}`);
  });
})();

process.on("uncaughtException", (err) => {
  console.error("Uncaught Exception:", err);
});
