import express from "express";
import { getProjectRouter } from "../../src/controller/projectController";
import { createProject } from "core/struct/project";
import request from "supertest";
import { createExpectation } from "core/struct/expectation";
import { getExpectationRouter } from "../../src/controller/expectationController";
import { CustomErrorMiddleware } from "../../src/controller/common";
import {
  CreateExpectationParam,
  UpdateExpectationParam,
} from "core/struct/params/ExpectationParams";
import { deleteFolderRecursive } from "../../src/common/utils";
import { createProxyAction } from "../../../core/struct/action";

async function deleteExpectation(
  server: express.Express,
  id: string,
  projectId: string
) {
  // test delete expectation
  const delResponse = await request(server)
    .delete(`/expectation/${id}?projectId=${projectId}`)
    .expect(200);
  expect(delResponse.body.message).toEqual("operation success");
}

describe("expectation controller", async () => {
  const server = express();
  server.use("/project",await getProjectRouter("test_db"));
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

  afterAll(async () => {
    deleteFolderRecursive("test_db");
  });

  test("test project id not exist error", async () => {
    const errorRes = await request(server).post("/expectation/").expect(400);
    expect(errorRes.body.error.message).toEqual("project id not exist!");
  });

  test("test expectation  not exist error", async () => {
    const errorRes = await request(server)
      .post("/expectation/")
      .send({
        projectId: projectId,
      })
      .expect(400);
    expect(errorRes.body.error.message).toEqual("expectation not exist!");
  });

  test("delete expectation fail", async () => {
    const errorRes = await request(server)
      .delete("/expectation/12321?projectId=" + projectId)
      .expect(500);
    expect(errorRes.body.error.message).toEqual("delete fail");
  });

  test("create expectation ", async () => {
    const expectationM = createExpectation();
    expectationM.name = "text expectation";
    expectationM.priority = 100;
    expectationM.action = createProxyAction();
    expectationM.action.host = "https://github.com";

    const createParam: CreateExpectationParam = {
      expectation: expectationM,
      projectId: projectId,
    };
    const createRes = await request(server)
      .post("/expectation/")
      .send(createParam)
      .expect(200);
    expect(createRes.body.priority).toBe(100);
    expect(createRes.body.action.host).toEqual("https://github.com");

    // test list expectation
    const listResponse = await request(server)
      .get("/expectation/?projectId=" + projectId)
      .expect(200);
    expect(listResponse.body.length === 1).toBe(true);
    expect(listResponse.body[0].action.host).toEqual("https://github.com");

    await deleteExpectation(server, createRes.body._id, projectId);

    // after delete,the list is empty
    const listResponse2 = await request(server)
      .get("/expectation/?projectId=" + projectId)
      .expect(200);
    expect(listResponse2.body.length === 0).toBe(true);
  });

  test("update expectation", async () => {
    const expectationM = createExpectation();
    expectationM.name = "text expectation";
    expectationM.priority = 100;
    expectationM.action = createProxyAction();
    expectationM.action.host = "https://github.com";

    const createParam: CreateExpectationParam = {
      expectation: expectationM,
      projectId: projectId,
    };
    const createRes = await request(server)
      .post("/expectation/")
      .send(createParam)
      .expect(200);
    expect(createRes.body.priority).toBe(100);
    expect(createRes.body.action.host).toEqual("https://github.com");

    // test update expectation
    const updateParam: UpdateExpectationParam = {
      projectId: projectId,
      updateQuery: {
        $set: {
          name: "expectation new name",
        },
      },
    };
    const updateResponse = await request(server)
      .put("/expectation/" + createRes.body._id)
      .send(updateParam)
      .expect(200);

    // get the expectation
    const detailResponse = await request(server)
      .get("/expectation/" + createRes.body._id)
      .send({ projectId: projectId })
      .expect(200);
    expect(detailResponse.body.name).toEqual("expectation new name");

    await deleteExpectation(server, createRes.body._id, projectId);
  });
});
