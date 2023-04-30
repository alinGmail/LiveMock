import express from "express";
import { projectRouter } from "../../src/controller/projectController";
test("project controller", async () => {
  const server = express(); //创建服务器
  server.use("/project", projectRouter);



});
