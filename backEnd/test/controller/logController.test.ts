import express from "express";
import {getLogRouter} from "../../src/controller/logController";
import {CustomErrorMiddleware} from "../../src/controller/common";
import {createProject} from "core/struct/project";
import {getNewLogNumber, getProjectDb} from "../../src/db/dbManager";
import {getLogCollection} from "../../src/log/logUtils";
import {createLog} from "core/struct/log";
import {deleteFolderRecursive} from "../../src/common/utils";
import supertest from "supertest";
import {ListLogReqQuery} from "../../../core/struct/params/LogParams";


describe('test log controller', ()=>{
    const server = express();
    const projectM = createProject();
    projectM.name = 'test log';
    const log1 = createLog(getNewLogNumber(projectM.id,"test_db"));
    const log2 = createLog(getNewLogNumber(projectM.id,"test_db"));
    const log3 = createLog(getNewLogNumber(projectM.id,"test_db"));
    const log4 = createLog(getNewLogNumber(projectM.id,"test_db"));
    log1.req = {body: undefined, headers: {}, method: "", rawBody: "", requestDate: new Date(), path:"log1_path"}
    log2.req = {body: undefined, headers: {}, method: "", rawBody: "", requestDate: new Date(), path:"log2_path"}
    log3.req = {body: undefined, headers: {}, method: "", rawBody: "", requestDate: new Date(), path:"log3_path"}
    log4.req = {body: undefined, headers: {}, method: "", rawBody: "", requestDate: new Date(), path:"log4_path"}


    beforeAll(async ()=>{
        server.use("/log", await getLogRouter("test_db"));
        const projectDb = await getProjectDb("test_db");
        const projectCollection = projectDb.getCollection("project");
        projectCollection.insert(projectM);
        const logCollection = await getLogCollection(projectM.id, "test_db");
        logCollection.insert(log1);
        logCollection.insert(log2);
        logCollection.insert(log3);
        logCollection.insert(log4);
        server.use(CustomErrorMiddleware);
    });
    afterAll(()=>{
        deleteFolderRecursive("test_db");
    });


    test('list log list',async ()=>{
        const allLogRes = await supertest(server).get("/log/")
            .query({projectId:projectM.id}).expect(200);
        expect(allLogRes.body.length).toBe(4);
        expect(allLogRes.body[0].req.path).toBe("log4_path");

        const halfLogRes = await supertest(server).get("/log/")
            .query({projectId:projectM.id,maxLogId:log3.id} as ListLogReqQuery).expect(200);
        expect(halfLogRes.body.length).toBe(2);
        expect(halfLogRes.body[0].req.path).toBe("log2_path");
    });


})