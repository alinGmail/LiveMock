import {createProject} from "core/struct/project";
import {createExpectation, ExpectationM} from "core/struct/expectation";
import express from "express";
import {getExpectationCollection, getProjectCollection, getProjectDb,} from "../../src/db/dbManager";
import {createPathMatcher, MatcherCondition} from "core/struct/matcher";
import getMockRouter from "../../src/server/mockServer";
import {ContentHandler, createCustomResponseAction, ResponseType,} from "core/struct/action";
import request from "supertest";

describe("test mock js action", () => {
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
    const projectCollection = await getProjectCollection("test_db");
    projectCollection.insert(project);
    // matcher
    const pathMatcher = createPathMatcher();
    pathMatcher.conditions = MatcherCondition.START_WITH;
    pathMatcher.value = "/";
    expectation.matchers.push(pathMatcher);
    expectationCollection = await getExpectationCollection(
      project.id,
      "test_db"
    );
    expectationCollection.insert(expectation);
    // server
    server.all("*", await getMockRouter("test_db", project.id));
  });

  test("mock array", async () => {
    const expectationCur = expectationCollection.findOne({
      id: expectation.id,
    });
    if (expectationCur === null) {
      throw new Error("expectationCur is null");
    }

    const customResponseAction = createCustomResponseAction();
    customResponseAction.status = 200;
    customResponseAction.responseContent.type = ResponseType.JSON;
    customResponseAction.responseContent.contentHandler =
      ContentHandler.MOCK_JS;
    customResponseAction.responseContent.value = JSON.stringify({
      "teacher|10": [
        {
          "id|+1": 1,
          name: "tom",
        },
      ],
    });
    expectationCur.actions = [customResponseAction];
    expectationCollection.update(expectationCur);
    const testRes = await request(server).get("/testMockJs").expect(200);
    expect(testRes.body.teacher.length).toEqual(10);

    customResponseAction.responseContent.type = ResponseType.TEXT;
    customResponseAction.responseContent.value = JSON.stringify({
      "teacher|5": [
        {
          "id|+1": 1,
          name: "tom",
        },
      ],
    });
    const testRes2 = await request(server).get("/testMockJs").expect(200);
    const resToJson = JSON.parse(testRes2.text);
    expect(resToJson.teacher.length).toEqual(5);

  });
});
