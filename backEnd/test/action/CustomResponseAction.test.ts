import {getExpectationDb, getLogDb, getProjectDb} from "../../src/db/dbManager";
import {createProject} from "core/struct/project";
import {createExpectation, ExpectationM} from "core/struct/expectation";
import {createPathMatcher, MatcherCondition} from "core/struct/matcher";
import {deleteFolderRecursive} from "../../src/common/utils";
import {createCustomResponseAction, ResponseType} from "core/struct/action";
import express from "express";
import getMockRouter from "../../src/server/mockServer";
import request from "supertest";
import {getLogCollection} from "../../src/log/logUtils";


describe('test custom response action', ()=>{
    let projectDb:Loki;
    const project = createProject();
    let expectationCollection:Collection<ExpectationM>;
    // expectation
    const expectation = createExpectation();
    expectation.activate = true;
    const server = express();

    beforeAll(async ()=>{
        projectDb = await getProjectDb("test_db");
        project.name = 'test custom response';
        const projectCollection = projectDb.getCollection("project");
        projectCollection.insert(project);

        // matcher
        const pathMatcher = createPathMatcher();
        pathMatcher.conditions =  MatcherCondition.START_WITH;
        pathMatcher.value = "/";
        expectation.matchers.push(pathMatcher);
        const expectationDb =await getExpectationDb(project.id,"test_db");
        expectationCollection = expectationDb.getCollection("expectation");
        expectationCollection.insert(expectation);

        // server
        server.use("*",await getMockRouter("test_db",project.id));
    });

    test("test response error",async ()=>{
        const expectationCur = expectationCollection.findOne({id:expectation.id});
        if(expectationCur === null){
            throw new Error("expectationCur is null");
        }
        const customResponseAction = createCustomResponseAction();
        customResponseAction.status = 400;
        customResponseAction.responseContent.type = ResponseType.TEXT;
        customResponseAction.responseContent.value = "some error happen!";
        expectationCur.actions = [customResponseAction];
        expectationCollection.update(expectationCur);

        const testRes = await request(server).get("/test/asdf/ccsdf").expect(400);
        expect(testRes.get('content-type')).toEqual("text/plain");
        expect(testRes.text).toEqual("some error happen!")


        // test the log
        const logCollection = await getLogCollection(project.id, "test_db");
        const logs = logCollection.chain().find({})
            .simplesort("id",{desc:true}).data();
        //expect(logs.length).toBe(1);
        expect(logs[0].id).toBe(100001);
        expect(logs[0].req!.path).toEqual("/test");
    });

    test('test response json',async ()=>{
        // test the log
        const logCollection = await getLogCollection(project.id, "test_db");
        const logs1 = logCollection.find({});
        expect(logs1.length === 1);
        expect(logs1[0].id).toBe(100001);


        const expectationCur = expectationCollection.findOne({id:expectation.id});
        if(expectationCur === null){
            throw new Error("expectationCur is null");
        }
        const responseAction = createCustomResponseAction();
        responseAction.status = 200;
        responseAction.responseContent.type = ResponseType.JSON;
        responseAction.responseContent.value = JSON.stringify({name:"john"});
        expectationCur.actions = [responseAction];
        expectationCollection.update(expectationCur);

        const testRes = await request(server).get("/test").expect(200);
        expect(testRes.get('content-type')).toEqual("application/json");
        expect(testRes.body.name).toEqual("john");


        const logs = logCollection.find({});
        console.log(logs.length);

        expect(logs.length).toBe(2);
        expect(logs[0].id).toBe(100001);

    });



    afterAll(async ()=>{
        deleteFolderRecursive("test_db");
    });



});