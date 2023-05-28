import express from "express";
import { getProjectRouter } from "./controller/projectController";
import { getExpectationRouter } from "./controller/expectationController";
import { CustomErrorMiddleware } from "./controller/common";
import { getMatcherRouter } from "./controller/matcherController";
import { getActionRouter } from "./controller/actionController";

const server = express();
(async function () {
  server.use("/project", await getProjectRouter("dev_db"));
  server.use("/expectation", getExpectationRouter("dev_db"));
  server.use("/matcher", getMatcherRouter("dev_db"));
  server.use("/action", await getActionRouter("dev_db"));
  server.use(CustomErrorMiddleware);
  server.listen(9002, () => {
    console.log("server start on 9002");
  });
})();


process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
});