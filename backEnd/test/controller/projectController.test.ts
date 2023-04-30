import express from "express";
import { getProjectRouter } from "../../src/controller/projectController";
import request from "supertest";
import { createProject } from "core/struct/project";
import { deleteFolderRecursive } from "../../src/common/utils";

test("project controller", async () => {
  const server = express(); //创建服务器
  server.use("/project", getProjectRouter("test_db"));

  const projectM = createProject();
  projectM.name = "new Project";

  const res = await request(server)
    .post("/project/")
    .send({
      project: projectM,
    })
    .expect(200)
    .expect("Content-Type", /json/);
  expect(res.body.name === projectM.name).toBe(true);


  const projectListRes = await request(server).get("/project/")
      .expect(200);
  expect(projectListRes.body.length === 1);
  expect(projectListRes.body[0].name).toEqual(projectM.name);




  deleteFolderRecursive("test_db");
});
