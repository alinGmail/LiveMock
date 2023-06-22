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
         'token':"this is a token!!!",
         "Content-Type":"text/plain"
      });

      await mockServer.forGet("/testNoContentType").thenReply(200,'no content type response',{

      });

      await mockServer.forPost('/testProxy2').thenReply(400,'server error',{
         'token':"this is another token!!!",
         "Content-Type":"text/plain"
      });

      // response json
      await mockServer.forGet("/testJson1").thenReply(200,JSON.stringify({
         name:"john",age:20
      }),{
         'token':"json header",
         "Content-Type":"application/json"
      });
      await mockServer.forGet("/testJsonNoContentType").thenReply(200,JSON.stringify({
         name:"john",age:20
      }),{

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

      const log = await getLastLog(projectM.id, 'test_db');
      expect(log.res!.body).toEqual("A mocked response");
      expect(log.res!.status).toBe(200);
      expect(log.res!.headers["token"]).toEqual("this is a token!!!");

      // test the proxy info
      // expect(log.proxyInfo.isProxy);
      // expect(log.proxyInfo.proxyToUrl === "http://localhost:3000/testProxy");
   });

   test('test no content type response',async ()=>{
      const response = await request(proxyServer).get("/testNoContentType").set({Accept:"text/plain"});
      expect(response.status).toEqual(200);
      expect(response.text).toEqual("no content type response");
      const log = await getLastLog(projectM.id, 'test_db');
      expect(log.res!.body).toEqual("no content type response");
      expect(log.res!.status).toBe(200);

   });


   test(`test proxy error`,async ()=>{
      const response = await request(proxyServer).post("/testProxy2");
      expect(response.status).toEqual(400);
      expect(response.text).toEqual("server error");
      expect(response.get("token")).toEqual("this is another token!!!");

      const log = await getLastLog(projectM.id, 'test_db');
      expect(log.res!.body).toEqual("server error");
      expect(log.res!.status).toBe(400);
      expect(log.res!.headers["token"]).toEqual("this is another token!!!");
   });

   test(`test proxy json`,async ()=>{
      const response = await request(proxyServer).get("/testJson1");
      expect(response.status).toEqual(200);
      expect(response.text).toEqual(JSON.stringify({
         name:"john",age:20
      }));
      expect(response.get("token")).toEqual("json header");
      expect(response.body.name).toBe("john");
      expect(response.body.age).toBe(20);

      const log = await getLastLog(projectM.id, 'test_db');
      expect(log.res!.body.name).toBe("john");
      expect(log.res!.status).toBe(200);
      expect(log.res!.headers["token"]).toEqual("json header");
   })

});

async function getLastLog(projectId:string,path:string){
   const logCollection = await getLogCollection(projectId, "test_db");
   const logs = logCollection.chain().simplesort("id",{desc:true}).find({}).data();
   let log = logs[0];
   return log;
}