import express from "express";
import { getProjectRouter } from "./controller/projectController";
import { getExpectationRouter } from "./controller/expectationController";
import { CustomErrorMiddleware } from "./controller/common";
import { getMatcherRouter } from "./controller/matcherController";
import { getActionRouter } from "./controller/actionController";
import {addLogListener, getLogRouter} from "./controller/logController";
import {getLogFilterRouter} from "./controller/logFilterController";
import {getLocal} from "mockttp";
import {getSystemCollection} from "./db/dbManager";
const { Server } = require("socket.io");

const server = express();
const http = require('http').Server(server);
const io = new Server(http,{
  cors: {
    origin: "http://localhost:5173"
  }
});
export const systemVersion = 801;
// io.fetchSockets()
async function projectInit() {
  const systemCollection = await getSystemCollection("userData");
  const systemConfig = systemCollection.findOne({});
  if(systemConfig){

  }else{
    systemCollection.insertOne({version:systemVersion});
  }
}
(async function () {
  await projectInit();
  server.use("/project", await getProjectRouter("db"));
  server.use("/expectation", getExpectationRouter("db"));
  server.use("/matcher", getMatcherRouter("db"));
  server.use("/action", await getActionRouter("db"));
  server.use("/logFilter", await getLogFilterRouter("db"));
  server.use("/log", await getLogRouter("db"));
  server.use("/dashboard",express.static("../frontEnd/dist"));
  server.all("/",(req,res)=>{
    res.redirect("/dashboard");
  })
  await addLogListener(io,"db");


  server.use(CustomErrorMiddleware);
  http.listen(9002, () => {
    console.log("server start on 9002");
  });


})();


process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
});