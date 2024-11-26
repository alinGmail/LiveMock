import express from "express";
import { getBaseEnvProject, setUpBaseEnv } from "../controller/baseEnv";
import { getLocal } from "mockttp";
import { createExpectation, ExpectationM } from "livemock-core/struct/expectation";
import { createPathMatcher, MatcherCondition } from "livemock-core/struct/matcher";
import { expectationCreation } from "../controller/common";
import { createProxyAction, ProxyActionM } from "livemock-core/struct/action";
import getMockRouter from "../../src/server/mockServer";
import request from "supertest";
import {
  getExpectationCollection,
  getLogCollection,
} from "../../src/db/dbManager";
import { ProjectM } from "livemock-core/struct/project";

const mockServerPort = "8025";

async function testJsonResponse(
  response: request.Response,
  projectM: ProjectM
) {
  expect(response.status).toEqual(200);
  expect(response.text).toEqual(
    JSON.stringify({
      name: "john",
      age: 20,
    })
  );
  expect(response.get("token")).toEqual("json header");

  const log = await getLastLog(projectM.id, "test_db");
  expect(log.res!.body.name).toBe("john");
  expect(log.res!.body.age).toBe(20);
  expect(log.res!.status).toBe(200);
  expect(log.res!.headers["token"]).toEqual("json header");
}

describe("test proxy action", () => {
  const projectM = getBaseEnvProject();
  const server = express();
  const mockServer = getLocal();
  const proxyServer = express();
  const expectationM = createExpectation();
  const proxyActionM = createProxyAction();

  beforeAll(async () => {
    await setUpBaseEnv(server);

    const pathMatcherM = createPathMatcher();
    pathMatcherM.conditions = MatcherCondition.START_WITH;
    pathMatcherM.value = "";
    expectationM.matchers = [pathMatcherM];
    expectationM.activate = true;
    expectationM.priority = 1;
    proxyActionM.host = `localhost:${mockServerPort}`;
    expectationM.actions.push(proxyActionM);

    const expectationCrossM = createExpectation();
    const pathMatcherCrossM = createPathMatcher();
    pathMatcherCrossM.conditions = MatcherCondition.START_WITH;
    pathMatcherCrossM.value = "/testCross";
    expectationCrossM.matchers = [pathMatcherCrossM];
    expectationCrossM.activate = true;
    expectationCrossM.priority = 2;
    const proxyCrossActionM = createProxyAction();
    proxyCrossActionM.host = `localhost:${mockServerPort}`;
    proxyCrossActionM.handleCross = true;
    proxyCrossActionM.crossAllowCredentials = true;
    proxyCrossActionM.headers?.push(["myToken", "myTokenValue"]);
    expectationCrossM.actions.push(proxyCrossActionM);

    await expectationCreation(server, projectM, expectationM);
    await expectationCreation(server, projectM, expectationCrossM);

    // set up the server
    await mockServer.start(parseInt(mockServerPort));

    await mockServer.forGet("/testProxy").thenReply(200, "A mocked response", {
      token: "this is a token!!!",
      "Content-Type": "text/plain",
    });

    await mockServer
      .forGet("/testNoContentType")
      .thenReply(200, "no content type response", {});

    await mockServer.forPost("/testProxy2").thenReply(400, "server error", {
      token: "this is another token!!!",
      "Content-Type": "text/plain",
    });

    // response json
    await mockServer.forGet("/testJson1").thenReply(
      200,
      JSON.stringify({
        name: "john",
        age: 20,
      }),
      {
        token: "json header",
        "Content-Type": "application/json",
      }
    );
    // response json
    await mockServer.forGet("/testCross").thenReply(
      200,
      JSON.stringify({
        name: "john",
        age: 20,
      }),
      {
        token: "json header",
        myToken: "origin value",
        "Content-Type": "application/json",
      }
    );
    await mockServer.forGet("/testJsonNoContentType").thenReply(
      200,
      JSON.stringify({
        name: "john",
        age: 20,
      }),
      {
        token: "json header",
      }
    );

    // for test request header
    await mockServer
      .forGet("/testRequestHeader")
      .withHeaders({
        myRequestHeader: "someHeaderValue",
      })
      .thenReply(
        200,
        JSON.stringify({
          message: "success",
        }),
        {
          "Content-Type": "application/json",
        }
      );

    // server
    proxyServer.all("*", await getMockRouter("test_db", projectM.id));
  });

  afterAll(() => {
    mockServer.stop();
  });
  test("test proxy response header", async () => {
    const response = await request(proxyServer).get("/testProxy");
    expect(response.status).toEqual(200);
    expect(response.text).toEqual("A mocked response");
    expect(response.get("token")).toEqual("this is a token!!!");

    const log = await getLastLog(projectM.id, "test_db");
    expect(log.res!.body).toEqual("A mocked response");
    expect(log.res!.status).toBe(200);
    expect(log.res!.headers["token"]).toEqual("this is a token!!!");
    expect(log.req!.path).toBe("/testProxy");
    // test the proxy info
    expect(log.proxyInfo!.isProxy).toEqual(true);
    expect(log.proxyInfo!.proxyHost === `http://localhost:${mockServerPort}`).toBe(true);
    expect(log.proxyInfo!.proxyPath === "/testProxy").toBe(true);
  });

  test("test proxy request header", async () => {
    const _requestHeaders = proxyActionM.requestHeaders;
    // set the response header
    proxyActionM.requestHeaders = [["myRequestHeader", "someHeaderValue"]];
    await updateProxyAction(
      projectM.id,
      "test_db",
      expectationM.id,
      proxyActionM
    );

    const response = await request(proxyServer).get("/testRequestHeader");

    expect(response.status).toEqual(200);
    expect(response.body?.message).toEqual("success");

    const log = await getLastLog(projectM.id, "test_db");
    expect(log.res!.status).toBe(200);
    expect(log.res!.body.message).toEqual("success");
    expect(log.proxyInfo!.isProxy).toEqual(true);
    expect(log.proxyInfo!.proxyHost).toEqual(`http://localhost:${mockServerPort}`);
    expect(log.proxyInfo!.proxyPath).toEqual("/testRequestHeader");
    expect(log.proxyInfo!.requestHeaders).toEqual([
      {
        name: "myRequestHeader",
        value: "someHeaderValue",
      },
    ]);

    // clean up
    proxyActionM.requestHeaders = _requestHeaders;
    await updateProxyAction(
      projectM.id,
      "test_db",
      expectationM.id,
      proxyActionM
    );
  });

  test("test prefix remove", async () => {
    const _prefixRemove = proxyActionM.prefixRemove;
    proxyActionM.prefixRemove = "/api";

    await updateProxyAction(
      projectM.id,
      "test_db",
      expectationM.id,
      proxyActionM
    );
    const response = await request(proxyServer).get("/api/testProxy");
    expect(response.status).toEqual(200);
    expect(response.text).toEqual("A mocked response");
    expect(response.get("token")).toEqual("this is a token!!!");

    // test the proxy info
    const log = await getLastLog(projectM.id, "test_db");
    expect(log.proxyInfo?.proxyPath).toBe("/testProxy");
    expect(log.proxyInfo?.isProxy).toBe(true);

    proxyActionM.prefixRemove = _prefixRemove;
    await updateProxyAction(
      projectM.id,
      "test_db",
      expectationM.id,
      proxyActionM
    );
  });

  test("test no content type response", async () => {
    const response = await request(proxyServer)
      .get("/testNoContentType")
      .set({ Accept: "text/plain" });
    expect(response.status).toEqual(200);
    expect(response.text).toEqual("no content type response");
    const log = await getLastLog(projectM.id, "test_db");
    expect(log.res!.body).toEqual("no content type response");
    expect(log.res!.status).toBe(200);

    // test the proxy info
    expect(log.proxyInfo!.isProxy).toBe(true);
    expect(log.proxyInfo!.proxyHost).toBe(`http://localhost:${mockServerPort}`);
    expect(log.proxyInfo!.proxyPath).toBe("/testNoContentType");
  });

  test(`test proxy error`, async () => {
    const response = await request(proxyServer).post(
      "/testProxy2?testParam=testVal"
    );
    expect(response.status).toEqual(400);
    expect(response.text).toEqual("server error");
    expect(response.get("token")).toEqual("this is another token!!!");

    const log = await getLastLog(projectM.id, "test_db");
    expect(log.res!.body).toEqual("server error");
    expect(log.res!.status).toBe(400);
    expect(log.res!.headers["token"]).toEqual("this is another token!!!");
    expect(log.req!.query["testParam"]).toEqual("testVal");
  });

  test(`test proxy json`, async () => {
    const response = await request(proxyServer).get("/testJson1");
    await testJsonResponse(response, projectM);
  });

  test(`test proxy json no content type`, async () => {
    const response = await request(proxyServer)
      .get("/testJsonNoContentType")
      .set({ Accept: "application/json" });
    await testJsonResponse(response, projectM);
  });

  test(`test handle cross`, async () => {
    const response = await request(proxyServer)
      .get("/testCross")
      .set("Origin", "www.google.com")
      .set("AccessToken", "aaa")
      .set("SecretName", "bbb");
    await testJsonResponse(response, projectM);
    expect(response.get("Access-Control-Allow-Origin")).toEqual(
      "www.google.com"
    );
    expect(response.get("Access-Control-Allow-Headers")).toContain(
      "accesstoken"
    );
    expect(response.get("Access-Control-Allow-Headers")).toContain(
      "secretname"
    );
    expect(response.get("Access-Control-Allow-Credentials")).toContain("true");
    expect(response.get("myToken")).toEqual("myTokenValue");


    const log = await getLastLog(projectM.id, "test_db");
    expect(log.proxyInfo!.responseHeaders).toEqual([{
      name: "myToken",
      value: "myTokenValue",
    }]);


    const optionResponse = await request(proxyServer)
      .options("/testCross")
      .set("Origin", "www.google.com")
      .set("Access-Control-Request-Headers", "accesstoken,secretname")
      .set("Access-Control-Request-Methods", "POST");
    expect(optionResponse.statusCode).toBe(200);
    expect(optionResponse.get("Access-Control-Allow-Origin")).toEqual(
      "www.google.com"
    );
    expect(optionResponse.get("Access-Control-Allow-Headers")).toContain(
      "accesstoken"
    );
    expect(optionResponse.get("Access-Control-Allow-Headers")).toContain(
      "secretname"
    );
    expect(optionResponse.get("Access-Control-Allow-Credentials")).toContain(
      "true"
    );
  });
});

async function getLastLog(projectId: string, path: string) {
  const logCollection = await getLogCollection(projectId, "test_db");
  const logs = logCollection
    .chain()
    .simplesort("id", { desc: true })
    .find({})
    .data();
  let log = logs[0];
  return log;
}

async function updateExpectation(
  projectId: string,
  path: string,
  expectation: ExpectationM
) {
  const expectationCollection = await getExpectationCollection(projectId, path);
  expectationCollection.update(expectation);
}

async function updateProxyAction(
  projectId: string,
  path: string,
  expectationId: string,
  action: ProxyActionM
) {
  const expectationMCollection = await getExpectationCollection(
    projectId,
    path
  );
  const expectation = expectationMCollection.findOne({ id: expectationId });
  if (expectation === null) {
    throw Error(`can not find expectation,by expectationId:${expectationId}`);
  }
  expectation.actions = [action];
  expectationMCollection.update(expectation);
}
