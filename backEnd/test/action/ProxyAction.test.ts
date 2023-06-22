import express from "express";
import {getBaseEnvProject, setUpBaseEnv} from "../controller/baseEnv";
import {getLocal} from "mockttp"
import {createExpectation} from "core/struct/expectation";
import {createPathMatcher, MatcherCondition} from "core/struct/matcher";
import {expectationCreation} from "../controller/common";
import {createProxyAction} from "core/struct/action";
import getMockRouter from "../../src/server/mockServer";
import request from "supertest";

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

      await expectationCreation(server, projectM, expectationM);
       // set up the server
      await mockServer.start(8081);

      await mockServer.forGet('/testProxy').thenReply(200,'A mocked response',{
         'token':"this is a token!!!"
      });

      await mockServer.forPost('/testProxy2').thenReply(400,'server error',{
         'token':"this is another token!!!"
      });
      // server
      proxyServer.use("*", await getMockRouter("test_db", proxyActionM.id));
   });

   afterAll(() => {
      mockServer.stop();
   })

   test(`test proxy get`,async ()=>{
      const response = await request(proxyServer).post("/testProxy");
      expect(response.status).toEqual(400);
      expect(response.text).toEqual("some error");
      expect(response.get("token")).toEqual("another token");
   });

});