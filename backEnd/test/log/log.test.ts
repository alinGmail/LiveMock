import express from "express";
import {createProject} from "core/struct/project";
import {createExpectation} from "core/struct/expectation";
import {createCustomResponseAction, ResponseType} from "core/struct/action";
import {getProjectRouter} from "../../src/controller/projectController";
import {getExpectationRouter} from "../../src/controller/expectationController";
import {getActionRouter} from "../../src/controller/actionController";
import {CustomErrorMiddleware} from "../../src/controller/common";
import request from "supertest";
import {deleteFolderRecursive} from "../../src/common/utils";
import getMockRouter from "../../src/server/mockServer";
import {createPathMatcher, MatcherCondition} from "core/struct/matcher";
import {getLogCollection, getLogDb} from "../../src/db/dbManager";


describe('test log',()=>{
    const server = express();
    const mockServer = express();
    const projectM = createProject();
    projectM.name = "new Project";
    const expectationM = createExpectation();
    expectationM.activate = true;
    const action = createCustomResponseAction();
    action.status = 200;
    action.responseContent.type = ResponseType.TEXT;
    action.responseContent.value = "test response";
    action.responseContent.headers = [["respHeader","test header value"]]
    expectationM.actions = [action];
    // matcher
    const pathMatcher = createPathMatcher();
    pathMatcher.conditions =  MatcherCondition.START_WITH;
    pathMatcher.value = "/testResponse";
    expectationM.matchers.push(pathMatcher);

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
        // server
        mockServer.all("*",await getMockRouter("test_db",projectM.id));
    });

    afterAll(async () => {
        deleteFolderRecursive("test_db");
    });

    test('custom response test',async ()=>{
        const res = await request(mockServer).post("/testResponse?testParam=paramVal")
            .send("request body test").set("token","abc_token").expect(200);

        expect(res.text).toEqual("test response");

        // get the log
        const logCollection = await getLogCollection(projectM.id,"test_db");
        const lastLog = logCollection.findOne({});
        // request log
        expect(lastLog!.req!.method).toBe("POST");
        expect(lastLog!.req!.rawBody).toBe("request body test");
        expect(lastLog!.req!.headers["token"]).toEqual("abc_token");

        // response log
        expect(lastLog!.res!.status).toBe(200);
        expect(lastLog!.res!.body).toBe("test response");
        expect(lastLog!.res!.rawBody).toBe("test response");
        expect(lastLog!.res!.headers["respheader"]).toEqual("test header value");

    });


})