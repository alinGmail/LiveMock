import express from "express";
import request from "supertest";
import { createProject } from "core/struct/project";
import { createExpectation } from "core/struct/expectation";
import { createProxyAction } from "core/struct/action";
import { getProjectRouter } from "../../src/controller/projectController";
import { getExpectationRouter } from "../../src/controller/expectationController";
import { getActionRouter } from "../../src/controller/actionController";
import { CustomErrorMiddleware } from "../../src/controller/common";
import { deleteFolderRecursive } from "../../src/common/utils";
import { CreateActionReqBody, UpdateActionReqBody } from "core/struct/params/ActionParams";

describe("action controller", () => {
  const server = express();
  const projectM = createProject();
  projectM.name = "new Project";
  const expectationM = createExpectation();
  const action = createProxyAction();
  action.host = "https://github.com";

  const routerSetup = async () => {
    server.use("/project", await getProjectRouter("test_db"));
    server.use("/expectation", getExpectationRouter("test_db"));
    server.use("/action", await getActionRouter("test_db"));
    server.use(CustomErrorMiddleware);
  };

  const projectCreation = async () => {
    await request(server)
        .post("/project/")
        .send({ project: projectM })
        .expect(200)
        .expect("Content-Type", /json/);
  };

  const expectationCreation = async () => {
    await request(server)
        .post("/expectation/")
        .send({
          expectation: expectationM,
          projectId: projectM.id,
        })
        .expect(200);
  };

  beforeAll(async () => {
    await routerSetup();
    await projectCreation();
    await expectationCreation();
  });

  afterAll(async () => {
    deleteFolderRecursive("test_db");
  });

  const actionTest = async () => {
    const createAction = async () => {
      await request(server)
          .post("/action/")
          .send({
            projectId: projectM.id,
            expectationId: expectationM.id,
            action: action,
          } as CreateActionReqBody)
          .expect(200);
    };

    const updateAction = async () => {
      await request(server)
          .put(`/action/`)
          .send({
            projectId: projectM.id,
            expectationId: expectationM.id,
            actionUpdate: { host: "https://www.google.com" },
          } as UpdateActionReqBody);
    };

    const expectAction = async (host) => {
      const expectationRes: request.Response = await request(server)
          .get(`/expectation/${expectationM.id}?projectId=${projectM.id}`)
          .expect(200);
      const newExp = expectationRes.body;
      expect(newExp.actions.length).toBe(1);
      expect(newExp.actions[0].host).toEqual(host);
    };

    await createAction();
    await expectAction("https://github.com");

    await updateAction();
    await expectAction("https://www.google.com");
  };

  test("create and update action", actionTest);
});
