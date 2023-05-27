import express from "express";
import { getProjectRouter } from "../../src/controller/projectController";
import request from "supertest";
import {createProject, ProjectStatus} from "core/struct/project";
import { deleteFolderRecursive } from "../../src/common/utils";
import { CustomErrorMiddleware } from "../../src/controller/common";
import { UpdateProjectReqBody } from "core/struct/params/ProjectParams";
import {getProjectDb} from "../../src/db/dbManager";
import supertest from "supertest";
import {getProjectStatus} from "../../src/server/projectStatusManage";
import { checkPort } from "../../src/util/commonUtils";

test("project controller", async () => {
  const server = express(); //创建服务器
  server.use("/project", await getProjectRouter("test_db"));
  server.use(CustomErrorMiddleware);

  const projectM = createProject();
  projectM.name = "new Project";
  projectM.port = "1234";

  // test project name not empty
  const errRes = await request(server)
    .post("/project/")
    .send({
      project: createProject(),
    })
    .expect(400);
  expect(errRes.body.error.message).toEqual("project name can not be empty!");

  const res = await request(server)
    .post("/project/")
    .send({
      project: projectM,
    })
    .expect(200)
    .expect("Content-Type", /json/);
  expect(res.body.name === projectM.name).toBe(true);
  expect(res.body.id).toBeTruthy();

  const projectListRes = await request(server).get("/project/").expect(200);
  expect(projectListRes.body.length === 1);
  expect(projectListRes.body[0].name).toEqual(projectM.name);
  expect(projectListRes.body[0].port).toEqual(projectM.port);

  // test update
  const updateRes = await request(server)
    .put("/project/" + projectM.id)
    .send({
      projectUpdate: { port: "4567" },
    } as UpdateProjectReqBody)
    .expect(200);


  // test update res
  const projectListRes2 = await request(server).get("/project/").expect(200);
  expect(projectListRes2.body.length === 1);
  expect(projectListRes2.body[0].port).toEqual("4567");

  deleteFolderRecursive("test_db");
});


test('start project',async ()=>{
  const server = express(); //创建服务器
  server.use("/project", await getProjectRouter("test_db"));
  server.use(CustomErrorMiddleware);
  // inset project
  const projectM = createProject();
  projectM.name = 'test proejct';
  projectM.port = "5123";
  const projectDb = await getProjectDb("test_db");
  const projectCollection = projectDb.getCollection("project");
  projectCollection.insert(projectM);

  // start project
  const startRes = await supertest(server).post("/project/start/"+ projectM.id).expect(200);
  // test the port is running
  const portIsRunning = await checkPort(projectM.port);
  expect(portIsRunning).toBe(true);
  const projectStatus = getProjectStatus(projectM.id);
  expect(projectStatus).toEqual(ProjectStatus.STARTED);

  // close project
  const stopRes = await supertest(server).post("/project/stop/"+projectM.id).expect(200);
  // test the port is running
  const portIsRunning2 = await checkPort(projectM.port);
  expect(portIsRunning2).toBe(false);
  const projectStatus2 = getProjectStatus(projectM.id);
  expect(projectStatus2).toEqual(ProjectStatus.STOPPED);

  // start fail
  projectM.port = "1000";
  projectCollection.update(projectM);
  // start project
  const startFail = await supertest(server).post("/project/start/"+ projectM.id).expect(500);


  deleteFolderRecursive("test_db");
});








