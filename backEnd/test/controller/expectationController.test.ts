import express from "express";
import { getProjectRouter } from "../../src/controller/projectController";
import { createProject } from "core/struct/project";
import request from "supertest";
import { createExpectation } from "core/struct/expectation";
import { getExpectationRouter } from "../../src/controller/expectationController";
import { CustomErrorMiddleware } from "../../src/controller/common";
import { CreateExpectationParam } from "core/struct/params/ExpectationParams";
import {deleteFolderRecursive} from "../../src/common/utils";

describe("expectation controller", () => {
  const server = express();
  server.use("/project", getProjectRouter("test_db"));
  server.use("/expectation", getExpectationRouter("test_db"));
  server.use(CustomErrorMiddleware);

  const projectM = createProject();
  projectM.name = "new Project";
  let projectId = "";
  beforeAll(async () => {
    const res = await request(server)
      .post("/project/")
      .send({
        project: projectM,
      })
      .expect(200)
      .expect("Content-Type", /json/);
    projectId = res.body._id;
    // create expectation
  });


  afterAll(async ()=>{
    deleteFolderRecursive("test_db");
  })

  test("test project id not exist error", async () => {
    const errorRes = await request(server).post("/expectation/").expect(400);
    expect(errorRes.body.error.message).toEqual("project id not exist!");
  });
  test("test expectation  not exist error", async () => {
    const errorRes = await request(server).post("/expectation/").send({
      projectId:projectId
    }).expect(400);
    expect(errorRes.body.error.message).toEqual("expectation not exist!");
  });
  test("create expectation ", async () => {
    const expectationM = createExpectation();
    expectationM.name = "text expectation";
    expectationM.priority = 100;

    const createParam: CreateExpectationParam = {
      expectation: expectationM,
      projectId: projectId,
    };
    const createRes = await request(server)
      .post("/expectation/")
      .send(createParam);
      //.expect(200);
      console.log(createRes.text);
      expect(createRes.body.priority).toBe(100);

  });
});
