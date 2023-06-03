import express from "express";
import { getProjectRouter } from "./controller/projectController";
import { getExpectationRouter } from "./controller/expectationController";
import { CustomErrorMiddleware } from "./controller/common";
import { getMatcherRouter } from "./controller/matcherController";
import { getActionRouter } from "./controller/actionController";
const { Server } = require("socket.io");

const server = express();
const http = require('http').Server(server);
const io = new Server(http,{
  cors: {
    origin: "http://localhost:5173"
  }
});

// io.fetchSockets()

(async function () {
  server.use("/project", await getProjectRouter("dev_db"));
  server.use("/expectation", getExpectationRouter("dev_db"));
  server.use("/matcher", getMatcherRouter("dev_db"));
  server.use("/action", await getActionRouter("dev_db"));
  server.use(CustomErrorMiddleware);
  http.listen(9002, () => {
    console.log("server start on 9002");
  });
})();


process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
});
