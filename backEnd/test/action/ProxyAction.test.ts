import express from "express";
import {getBaseEnvProject, setUpBaseEnv} from "../controller/baseEnv";
import {getLocal} from "mockttp"
import {createExpectation} from "core/struct/expectation";
import {createPathMatcher, MatcherCondition} from "core/struct/matcher";
import {expectationCreation} from "../controller/common";
import {createProxyAction} from "core/struct/action";
import getMockRouter from "../../src/server/mockServer";
import request from "supertest";
import {getExpectationCollection, getLogCollection} from "../../src/db/dbManager";

describe("test proxy action",()=>{
   const projectM = getBaseEnvProject();
   const server = express();
   const mockServer = getLocal();
   const proxyServer = express();

   beforeAll(async ()=>{
      await setUpBaseEnv(server);

      const expectationM = createExpectation();
      const pathMatcherM = createPathMatcher();
      pathMatcherM.conditions = MatcherCondition.START_WITH;
      pathMatcherM.value = "";
      expectationM.matchers = [pathMatcherM];
      expectationM.activate = true;
      const proxyActionM = createProxyAction();
      proxyActionM.host = "http://localhost:8081";
      expectationM.actions.push(proxyActionM);


      await expectationCreation(server, projectM, expectationM);
      const expectationMCollection = await getExpectationCollection(projectM.id, 'test_db');

      // set up the server
      await mockServer.start(8081);

      await mockServer.forGet('/testProxy').thenReply(200,'A mocked response',{
         'token':"this is a token!!!"
      });

      await mockServer.forPost('/testProxy2').thenReply(400,'server error',{
         'token':"this is another token!!!"
      });
      // server
      proxyServer.all("*", await getMockRouter("test_db", projectM.id));
   });

   afterAll(() => {
      mockServer.stop();
   });
   test("test proxy header", async () => {


      const response = await request(proxyServer).get("/testProxy");
      expect(response.status).toEqual(200);
      expect(response.text).toEqual("A mocked response");
      expect(response.get("token")).toEqual("this is a token!!!");

      const logCollection = await getLogCollection(projectM.id, "test_db");
      const logs = logCollection.find({});
      expect(logs.length).toEqual(1);
      let log = logs[0];
      //expect(log.req.body).toEqual("A mocked response");
      expect(log.res!.headers["token"]).toEqual("this is a token,ha ha ha!!!")

      // test the proxy info
      // expect(log.proxyInfo.isProxy);
      // expect(log.proxyInfo.proxyToUrl === "http://localhost:3000/testProxy");
   });

   test(`test proxy error`,async ()=>{
      const response = await request(proxyServer).post("/testProxy2");
      expect(response.status).toEqual(400);
      expect(response.text).toEqual("server error");
      expect(response.get("token")).toEqual("this is another token!!!");
   });

});