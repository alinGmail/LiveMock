import express from "express";
import { getProjectRouter } from "../../src/controller/projectController";
import { getExpectationRouter } from "../../src/controller/expectationController";
import { CustomErrorMiddleware } from "../../src/controller/common";
import { createProject } from "core/struct/project";
import request from "supertest";
import { deleteFolderRecursive } from "../../src/common/utils";
import { createExpectation, ExpectationM } from "core/struct/expectation";
import { CreateExpectationReqBody } from "core/struct/params/ExpectationParams";
import { createPathMatcher, RequestMatcherType } from "core/struct/matcher";
import { getMatcherRouter } from "../../src/controller/matcherController";
import {
  CreateMatcherReqBody,
  UpdateMatcherReqBody,
} from "core/struct/params/MatcherParams";

describe("matcher controller", () => {
  const server = express();

  const projectM = createProject();
  projectM.name = "new Project";
  let projectId = "";
  let expectationId = "";
  beforeAll(async () => {
    server.use("/project", await getProjectRouter("test_db"));
    server.use("/expectation", getExpectationRouter("test_db"));
    server.use("/matcher", getMatcherRouter("test_db"));
    server.use(CustomErrorMiddleware);

    const res = await request(server)
      .post("/project/")
      .send({
        project: projectM,
      })
      .expect(200)
      .expect("Content-Type", /json/);
    projectId = res.body.id;

    const expectationM = createExpectation();
    expectationM.name = "text expectation";
    expectationM.priority = 100;
    const createParam: CreateExpectationReqBody = {
      expectation: expectationM,
      projectId: projectId,
    };
    const createRes = await request(server)
      .post("/expectation/")
      .send(createParam)
      .expect(200);
    expect(createRes.body.priority).toBe(100);
    expectationId = createRes.body.id;
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
      } as CreateMatcherReqBody)
      .expect(200);
    //console.log(pathCreateParam.body);
    // get the expectation
    const expectationRes: request.Response = await request(server)
      .get(`/expectation/${expectationId}?projectId=${projectId}`)
      .expect(200);
    expect(expectationRes.body.id).toEqual(expectationId);
    const expectation: ExpectationM = expectationRes.body;
    expect(expectation.matchers.length).toBe(1);
    expect(expectation.matchers[0].value).toEqual("/testPath");
    expect(expectation.matchers[0].conditions).toEqual(pathMatcherM.conditions);
    expect(expectation.matchers[0].type).toEqual(RequestMatcherType.PATH);

    // test modify matcher
    const modifyRes = await request(server)
      .put(`/matcher/${pathMatcherM.id}`)
      .send({
        projectId,
        expectationId,
        matcherUpdate: {
          value: "/modifyPath",
        },
      } as UpdateMatcherReqBody)
      .expect(200);

    // test the result
    const expectationRes3: request.Response = await request(server)
      .get(`/expectation/${expectationId}?projectId=${projectId}`)
      .expect(200);
    expect(expectationRes3.body.id).toEqual(expectationId);
    const expectation3: ExpectationM = expectationRes3.body;
    expect(expectation3.matchers.length).toBe(1);
    expect(expectation3.matchers[0].value).toEqual("/modifyPath");

    // test delete
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
