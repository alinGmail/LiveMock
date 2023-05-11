import express from "express";
import { createProject } from "core/struct/project";
import { getProjectRouter } from "../../src/controller/projectController";
import { getExpectationRouter } from "../../src/controller/expectationController";
import { CustomErrorMiddleware } from "../../src/controller/common";
import { getActionRouter } from "../../src/controller/actionController";
import request from "supertest";
import { deleteFolderRecursive } from "../../src/common/utils";
import { createExpectation, ExpectationM } from "core/struct/expectation";
import { CreateExpectationReqBody } from "core/struct/params/ExpectationParams";
import { createProxyAction, ProxyActionM } from "core/struct/action";
import {
  CreateActionReqBody,
  UpdateActionReqBody,
} from "core/struct/params/ActionParams";

describe("action controller", () => {
  const server = express();

  const projectM = createProject();
  projectM.name = "new Project";
  const expectationM = createExpectation();
  beforeAll(async () => {
    server.use("/project", await getProjectRouter("test_db"));
    server.use("/expectation", getExpectationRouter("test_db"));
    server.use("/action", await getActionRouter("test_db"));
    server.use(CustomErrorMiddleware);

    const res = await request(server)
      .post("/project/")
      .send({
        project: projectM,
      })
      .expect(200)
      .expect("Content-Type", /json/);
    const createParam: CreateExpectationReqBody = {
      expectation: expectationM,
      projectId: projectM.id,
    };
    const createRes = await request(server)
      .post("/expectation/")
      .send(createParam)
      .expect(200);
  });
  afterAll(async () => {
    deleteFolderRecursive("test_db");
  });

  test("create action", async () => {
    const action = createProxyAction();
    action.host = "https://github.com";
    // create action
    const createRes = await request(server)
      .post("/action/")
      .send({
        projectId: projectM.id,
        expectationId: expectationM.id,
        action: action,
      } as CreateActionReqBody)
      .expect(200);

    // get action
    const expectationRes: request.Response = await request(server)
      .get(`/expectation/${expectationM.id}?projectId=${projectM.id}`)
      .expect(200);
    const newExp: ExpectationM = expectationRes.body;
    expect(newExp.actions.length).toBe(1);
    expect((newExp.actions[0] as ProxyActionM).host).toEqual(
      "https://github.com"
    );

    const updateRes: request.Response = await request(server)
      .put(`/action/`)
      .send({
        projectId: projectM.id,
        expectationId: expectationM.id,
        actionUpdate: { host: "https://www.google.com" },
      } as UpdateActionReqBody);
    const expectationRes2: request.Response = await request(server)
      .get(`/expectation/${expectationM.id}?projectId=${projectM.id}`)
      .expect(200);
    const newExp2: ExpectationM = expectationRes2.body;
    expect(newExp2.actions.length).toBe(1);
    expect((newExp2.actions[0] as ProxyActionM).host).toEqual(
      "https://www.google.com"
    );

    await request(server);
  });
});
