import express from "express";
import request from "supertest";
import { createProject } from "livemock-core/struct/project";
import { createExpectation } from "livemock-core/struct/expectation";
import { createProxyAction, createStaticDirectoryAction } from "livemock-core/struct/action";
import { getProjectRouter } from "../../src/controller/projectController";
import { getExpectationRouter } from "../../src/controller/expectationController";
import { getActionRouter } from "../../src/controller/actionController";
import { CustomErrorMiddleware } from "../../src/controller/common";
import { deleteFolderRecursive } from "../../src/common/utils";
import { CreateActionReqBody, UpdateActionReqBody } from "livemock-core/struct/params/ActionParams";

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
      const res = await request(server)
          .put(`/action/${action.id}`)
          .send({
            projectId: projectM.id,
            expectationId: expectationM.id,
            actionUpdate: { host: "https://www.google.com" },
          } as UpdateActionReqBody).expect(200);
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

  const staticActionTest = async () => {
    const staticAction = createStaticDirectoryAction();
    staticAction.folderPath = "/tmp/static-folder";
    staticAction.urlPrefix = "/static";

    await request(server)
        .post("/action/")
        .send({
          projectId: projectM.id,
          expectationId: expectationM.id,
          action: staticAction,
        } as CreateActionReqBody)
        .expect(200);

    const expectStaticAction = async (folderPath: string, urlPrefix: string) => {
      const expectationRes: request.Response = await request(server)
          .get(`/expectation/${expectationM.id}?projectId=${projectM.id}`)
          .expect(200);
      expect(expectationRes.body.actions.length).toBe(1);
      expect(expectationRes.body.actions[0].type).toEqual("STATIC_DIRECTORY");
      expect(expectationRes.body.actions[0].folderPath).toEqual(folderPath);
      expect(expectationRes.body.actions[0].urlPrefix).toEqual(urlPrefix);
    };

    await expectStaticAction("/tmp/static-folder", "/static");

    await request(server)
        .put(`/action/${staticAction.id}`)
        .send({
          projectId: projectM.id,
          expectationId: expectationM.id,
          actionUpdate: { urlPrefix: "/assets" },
        } as UpdateActionReqBody)
        .expect(200);

    await expectStaticAction("/tmp/static-folder", "/assets");
  };

  test("create and update static directory action", staticActionTest);
});
