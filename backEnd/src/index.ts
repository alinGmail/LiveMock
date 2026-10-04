import express from "express";
import { getApiRouter } from "./apiRouter";
import { addLogListener } from "./controller/logController";
import { getSystemCollection } from "./db/dbManager";
import { sysEventEmitter } from "./common/eventEmitters";
import { SystemEvent } from "livemock-core/struct/events/systemEvent";
import { addWsEventListeners } from "./common/eventListener";
import { getConfig } from "./config/config";
import { applyTrustProxy } from "./auth/trustProxy";
import { createSocketAuthMiddleware } from "./auth/socketAuth";
import { sweepExpiredSessions } from "./auth/authStore";

const { Server } = require("socket.io");

const server = express();
applyTrustProxy(server);
const http = require("http").Server(server);
const defaultCorsOrigins = ["http://localhost:5173"];
const parsedCorsOrigins = (process.env.CORS_ORIGIN || "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);
const corsOrigins = parsedCorsOrigins.length
  ? parsedCorsOrigins
  : defaultCorsOrigins;
const io = new Server(http, {
  path: "/api/socket.io",
  cors: {
    origin: corsOrigins,
  },
});
export const systemVersion = 801;

const config = getConfig();
const dbPath = config.database.path;

io.use(createSocketAuthMiddleware(dbPath));

// housekeeping: drop sessions that expired without being used again
const sessionSweep = setInterval(() => {
  sweepExpiredSessions(dbPath).catch(() => undefined);
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

addWsEventListeners();

(async function () {
  // wait all start event finish
  await Promise.all(
    sysEventEmitter.listeners(SystemEvent.START).map((listener) => listener())
  );

  const apiRouter = await getApiRouter(dbPath);
  server.use("/api", apiRouter);
  server.use("/dashboard", express.static("../frontEnd/dist"));
  server.all("/", (req, res) => {
    res.redirect("/dashboard");
  });
  await addLogListener(io, dbPath);

  const port = Number(process.env.LIVEMOCK_PORT) || 9002;
  http.listen(port, () => {
    console.log(`server start on ${port}`);
  });
})();

process.on("uncaughtException", (err) => {
  console.error("Uncaught Exception:", err);
});
