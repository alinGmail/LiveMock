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
import {getLogDb} from "../../src/db/dbManager";
import {getLogCollection} from "../../src/log/logUtils";


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
    expectationM.actions = [action];
    // matcher
    const pathMatcher = createPathMatcher();
    pathMatcher.conditions =  MatcherCondition.START_WITH;
    pathMatcher.value = "";
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
        mockServer.use("*",await getMockRouter("test_db",projectM.id));
    });

    afterAll(async () => {
        deleteFolderRecursive("test_db");
    });

    test('custom response test',async ()=>{
        const res = await request(mockServer).post("/test?testParam=paramVal")
            .send("request body test")//.expect(200);

        expect(res.text).toEqual("test response");

        // get the log
        const logDb = await getLogDb(projectM.id,"test_db");
        const logCollection = await getLogCollection(projectM.id,"test_db");
        const lastLog = logCollection.findOne({});
        expect(lastLog!.req!.method).toBe("POST");
        expect(lastLog!.req!.rawBody).toBe("request body test");
    });


})