import express from "express";
import {createProject, ProjectM} from "core/struct/project";
import {getProjectRouter} from "../../src/controller/projectController";
import {getActionRouter} from "../../src/controller/actionController";
import {CustomErrorMiddleware} from "../../src/controller/common";
import {getLogFilterRouter} from "../../src/controller/logFilterController";
import request from "supertest";
import supertest from "supertest";
import {createSimpleFilter, FilterType, SimpleFilterM} from "core/struct/log";
import {CreateLogFilterReqBody, DeleteLogFilterReqQuery, UpdateLogFilterReqBody} from "core/struct/params/LogFilterParam";
import {getLogViewDb, getProjectDb} from "../../src/db/dbManager";
import {createLogView, LogViewM} from "core/struct/logView";


describe(`log filter controller`, () => {
    const server = express();
    const projectM = createProject();
    projectM.name = "new Project";


    const routerSetup = async () => {
        server.use("/project", await getProjectRouter("test_db"));
        server.use("/logFilter", await getLogFilterRouter("test_db"));
        server.use("/action", await getActionRouter("test_db"));
        server.use(CustomErrorMiddleware);
    };
    const projectCreation = async () => {
        await request(server)
            .post("/project/")
            .send({project: projectM})
            .expect(200)
            .expect("Content-Type", /json/);
    };
    beforeAll(async () => {
        await routerSetup();
        await projectCreation();
    });


    test('add log filter', async () => {


        const logViewDb = await getLogViewDb(projectM.id, "test_db");
        const logViewMCollection = logViewDb.getCollection<LogViewM>('logView');
        const logView = logViewMCollection.findOne({});
        expect(logView?.filters.length).toBe(0);
        const simpleFilterM = createSimpleFilter();
        simpleFilterM.value = "filterValue1";
        simpleFilterM.property = "filterProperty1"
        let param: CreateLogFilterReqBody = {filter: simpleFilterM, logViewId: logView!.id, projectId: projectM.id}
        const addRes = await supertest(server).post("/logFilter/").send(param).expect(200);


        const newLogView = logViewMCollection.findOne({});
        expect(newLogView!.filters.length).toBe(1);
        const dbFilter = newLogView!.filters[0];
        expect(dbFilter.type).toBe(FilterType.SIMPLE_FILTER);
        expect((dbFilter as SimpleFilterM).value).toBe("filterValue1");
        expect((dbFilter as SimpleFilterM).property).toBe("filterProperty1");

        const simpleFilterM2 = createSimpleFilter();
        let param2: CreateLogFilterReqBody = {filter: simpleFilterM2, logViewId: logView!.id, projectId: projectM.id}
        const addRes2 = await supertest(server).post("/logFilter/").send(param2).expect(200);

        //test update
        simpleFilterM.value = "filterValue2";
        simpleFilterM.property = "filterProperty2";
        let updateParam: UpdateLogFilterReqBody = {
            filter: simpleFilterM,
            logViewId: logView!.id,
            projectId: projectM.id
        }
        const updateRes = await supertest(server).post("/logFilter/" + simpleFilterM.id).send(updateParam)
            .expect(200);
        const updatedLogView = logViewMCollection.findOne({});
        expect(newLogView!.filters.length).toBe(2);
        const dbFilterUpdated = updatedLogView!.filters[0];
        expect((dbFilterUpdated as SimpleFilterM).value).toBe("filterValue2");
        expect((dbFilterUpdated as SimpleFilterM).property).toBe("filterProperty2");

        // test delete
        let deleteQuery: DeleteLogFilterReqQuery = {logViewId: logView!.id, projectId: projectM.id}
        const deleteRes = await supertest(server).delete("/logFilter/" + simpleFilterM.id).query(deleteQuery).expect(200);
        const logViewAfterDel = logViewMCollection.findOne({});
        expect(logViewAfterDel!.filters.length).toBe(1);
    });


});