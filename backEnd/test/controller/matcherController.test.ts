import express from "express";
import { getProjectRouter } from "../../src/controller/projectController";
import { getExpectationRouter } from "../../src/controller/expectationController";
import { CustomErrorMiddleware } from "../../src/controller/common";
import { createProject } from "core/struct/project";
import request from "supertest";
import { deleteFolderRecursive } from "../../src/common/utils";
import { createExpectation, ExpectationM } from "core/struct/expectation";
import { CreateExpectationParam } from "core/struct/params/ExpectationParams";
import { createPathMatcher, RequestMatcherType } from "core/struct/matcher";
import { getMatcherRouter } from "../../src/controller/matcherController";
import { CreateMatcherParams } from "core/struct/params/MatcherParams";

describe("matcher controller", () => {
  const server = express();
  server.use("/project", getProjectRouter("test_db"));
  server.use("/expectation", getExpectationRouter("test_db"));
  server.use("/matcher", getMatcherRouter("test_db"));
  server.use(CustomErrorMiddleware);

  const projectM = createProject();
  projectM.name = "new Project";
  let projectId = "";
  let expectationId = "";
  beforeAll(async () => {
    const res = await request(server)
      .post("/project/")
      .send({
        project: projectM,
      })
      .expect(200)
      .expect("Content-Type", /json/);
    projectId = res.body._id;

    const expectationM = createExpectation();
    expectationM.name = "text expectation";
    expectationM.priority = 100;
    const createParam: CreateExpectationParam = {
      expectation: expectationM,
      projectId: projectId,
    };
    const createRes = await request(server)
      .post("/expectation/")
      .send(createParam)
      .expect(200);
    expect(createRes.body.priority).toBe(100);
    expectationId = createRes.body._id;
  });

  afterAll(async () => {
    deleteFolderRecursive("test_db");
  });

  test("create pathMatcher", async () => {
    const pathMatcherM = createPathMatcher();
    pathMatcherM.value = "/testPath";

    const pathCreateParam = await request(server)
      .post("/matcher")
      .send({
        projectId: projectId,
        expectationId: expectationId,
        matcher: pathMatcherM,
      } as CreateMatcherParams)
      .expect(200);

    // get the expectation
    const expectationRes: request.Response = await request(server)
      .get(`/expectation/${expectationId}?projectId=${projectId}`)
      .expect(200);
    expect(expectationRes.body._id).toEqual(expectationId);
    const expectation: ExpectationM = expectationRes.body;
    expect(expectation.matchers.length).toBe(1);
    expect(expectation.matchers[0].value).toEqual("/testPath");
    expect(expectation.matchers[0].conditions).toEqual(pathMatcherM.conditions);
    expect(expectation.matchers[0].type).toEqual(RequestMatcherType.PATH);

    const deleteRes: request.Response = await request(server)
      .delete(
        `/matcher/${pathMatcherM.id}?projectId=${projectId}&expectationId=${expectationId}`
      )
      .expect(200);
    expect(deleteRes.body.message).toEqual("operation success");

    const expectationRes2: request.Response = await request(server)
      .get(`/expectation/${expectationId}?projectId=${projectId}`)
      .expect(200);
    expect(expectationRes2.body.matchers.length).toBe(0);

  });
});
