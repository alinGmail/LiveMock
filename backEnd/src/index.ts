import express from "express";
import { getProjectRouter } from "./controller/projectController";
import { getExpectationRouter } from "./controller/expectationController";
import { CustomErrorMiddleware } from "./controller/common";
import { getMatcherRouter } from "./controller/matcherController";
import { getActionRouter } from "./controller/actionController";
import {addLogListener, getLogRouter} from "./controller/logController";
import {getLogFilterRouter} from "./controller/logFilterController";
import {logViewEventEmitter} from "./common/logViewEvent";
import {LogM} from "core/struct/log";
import {getLocal} from "mockttp";
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
  server.use("/logFilter", await getLogFilterRouter("dev_db"));
  server.use("/log", await getLogRouter("dev_db"));
  await addLogListener(io,"dev_db");


  server.use(CustomErrorMiddleware);
  http.listen(9002, () => {
    console.log("server start on 9002");
  });


  const mockServer = getLocal();
  // set up the server
  await mockServer.start(8081);

  await mockServer.forGet('/testProxy').thenReply(200,'A mocked response',{
    'token':"this is a token!!!"
  });

  await mockServer.forPost('/testProxy2').thenReply(400,'server error',{
    'token':"this is another token!!!"
  });
})();


process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
});
