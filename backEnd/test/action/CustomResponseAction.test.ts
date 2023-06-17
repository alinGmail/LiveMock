import {
  getExpectationCollection,
  getExpectationDb, getLogCollection,
  getLogDb, getProjectCollection,
  getProjectDb,
} from "../../src/db/dbManager";
import { createProject } from "core/struct/project";
import { createExpectation, ExpectationM } from "core/struct/expectation";
import { createPathMatcher, MatcherCondition } from "core/struct/matcher";
import { deleteFolderRecursive } from "../../src/common/utils";
import { createCustomResponseAction, ResponseType } from "core/struct/action";
import express from "express";
import getMockRouter from "../../src/server/mockServer";
import request from "supertest";

describe("test custom response action", () => {
  let projectDb: Loki;
  const project = createProject();
  let expectationCollection: Collection<ExpectationM>;
  // expectation
  const expectation = createExpectation();
  expectation.activate = true;
  const server = express();

  beforeAll(async () => {
    projectDb = await getProjectDb("test_db");
    project.name = "test custom response";
    const projectCollection = await getProjectCollection('test_db');
    projectCollection.insert(project);
    // matcher
    const pathMatcher = createPathMatcher();
    pathMatcher.conditions = MatcherCondition.START_WITH;
    pathMatcher.value = "/";
    expectation.matchers.push(pathMatcher);
    expectationCollection = await getExpectationCollection(project.id,'test_db');
    expectationCollection.insert(expectation);

    // server
    server.use("*", await getMockRouter("test_db", project.id));
  });

  test("test response error", async () => {
    const expectationCur = expectationCollection.findOne({
      id: expectation.id,
    });
    if (expectationCur === null) {
      throw new Error("expectationCur is null");
    }
    const customResponseAction = createCustomResponseAction();
    customResponseAction.status = 400;
    customResponseAction.responseContent.type = ResponseType.TEXT;
    customResponseAction.responseContent.value = "some error happen!";
    expectationCur.actions = [customResponseAction];
    expectationCollection.update(expectationCur);

    const testRes = await request(server)
      .get("/testText")
      .set("test-header", "test header value")
      .expect(400);
    expect(testRes.get("content-type")).toEqual("text/plain");
    expect(testRes.text).toEqual("some error happen!");

    // test the log
    const logCollection = await getLogCollection(project.id, "test_db");
    const logs = logCollection
      .chain()
      .find({})
      .simplesort("id", { desc: true })
      .data();
    //expect(logs.length).toBe(1);
    const log = logs[0];
    expect(log.id).toBe(100001);
    expect(log.req!.path).toEqual("/testText");
    expect(log.req!.method).toBe("GET");
    expect(log.req!.headers["test-header"]).toBe("test header value");

    expect(log.res!.headers["content-type"]).toBe("text/plain");
    expect(log.res!.status).toBe(400);
    expect(log.res!.rawBody).toBe("some error happen!");
  });

  test("test response json", async () => {
    const expectationCur = expectationCollection.findOne({
      id: expectation.id,
    });
    if (expectationCur === null) {
      throw new Error("expectationCur is null");
    }
    const responseAction = createCustomResponseAction();
    responseAction.status = 200;
    responseAction.responseContent.type = ResponseType.JSON;
    responseAction.responseContent.value = JSON.stringify({ name: "john" });
    expectationCur.actions = [responseAction];
    expectationCollection.update(expectationCur);

    const testRes = await request(server)
      .get("/testJson")
      .set("test-header", "test header value")
      .expect(200);
    expect(testRes.get("content-type")).toEqual("application/json");
    expect(testRes.body.name).toEqual("john");

    // test the log
    const logCollection = await getLogCollection(project.id, "test_db");
    const logs = logCollection.chain().find({}).simplesort("id",{desc:true}).data();

    const lastLog = logs[0];
    expect(lastLog.req!.path).toBe("/testJson");
    expect(lastLog.req!.headers["test-header"]).toBe("test header value");

    expect(lastLog.res!.status).toBe(200);
    expect(typeof lastLog.res!.body).toBe("object");
    expect(lastLog.res!.body.name).toBe("john");
    expect(lastLog.res!.headers["content-type"]).toBe("application/json");
    //expect(lastLog.res!.rawBody).toBe(JSON.stringify({name:"john"}));
    expect(typeof lastLog.res!.rawBody).toBe("string");
    expect(JSON.parse(lastLog.res!.rawBody!).name).toBe("john");
  });

  afterAll(async () => {
    deleteFolderRecursive("test_db");
  });
});
