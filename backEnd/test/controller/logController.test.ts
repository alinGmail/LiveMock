import express from "express";
import {CustomErrorMiddleware} from "../../src/controller/common";
import {createProject, ProjectM} from "core/struct/project";
import {getLogCollection, getNewLogNumber,} from "../../src/db/dbManager";
import {createLog, createSimpleFilter, LogFilterCondition} from "core/struct/log";
import {deleteFolderRecursive} from "../../src/common/utils";
import supertest from "supertest";
import {ListLogReqQuery} from "core/struct/params/LogParams";
import {logFilterCreation, logFilterDeletion, logFilterUpdateAction, projectCreation, routerSetup} from "./common";

describe("test log controller", () => {
  const server = express();
  const projectM = createProject();
  projectM.name = "test log";
  const log1 = createLog(getNewLogNumber(projectM.id, "test_db"));
  const log2 = createLog(getNewLogNumber(projectM.id, "test_db"));
  const log3 = createLog(getNewLogNumber(projectM.id, "test_db"));
  const log4 = createLog(getNewLogNumber(projectM.id, "test_db"));
  log1.req = {
    body: undefined,
    headers: {
        token:"abc"
    },
    query:{},
    method: "",
    rawBody: "",
    requestDate: new Date(),
    path: "log1_path",
  };
  log2.req = {
    body: undefined,
    headers: {
        token:"abcde"
    },
    query:{},
    method: "",
    rawBody: "",
    requestDate: new Date(),
    path: "log2_path",
  };
  log3.req = {
    body: undefined,
    headers: {
        token:"efg"
    },
    query:{},
    method: "",
    rawBody: "",
    requestDate: new Date(),
    path: "log3_path",
  };
  log4.req = {
    body: undefined,
    headers: {
        token:"opq"
    },
    query:{},
    method: "",
    rawBody: "",
    requestDate: new Date(),
    path: "log4_path",
  };

  beforeAll(async () => {
    await routerSetup(server);
    await projectCreation(server, projectM);
    const logCollection = await getLogCollection(projectM.id, "test_db");
    logCollection.insert(log1);
    logCollection.insert(log2);
    logCollection.insert(log3);
    logCollection.insert(log4);
    server.use(CustomErrorMiddleware);
  });
  afterAll(() => {
    deleteFolderRecursive("test_db");
  });

  test("list log list", async () => {
    const allLogRes = await supertest(server)
      .get("/log/")
      .query({ projectId: projectM.id })
      .expect(200);
    expect(allLogRes.body.length).toBe(4);
    expect(allLogRes.body[0].req.path).toBe("log4_path");

    const halfLogRes = await supertest(server)
      .get("/log/")
      .query({ projectId: projectM.id, maxLogId: log3.id } as ListLogReqQuery)
      .expect(200);
    expect(halfLogRes.body.length).toBe(2);
    expect(halfLogRes.body[0].req.path).toBe("log2_path");
  });

  test("log view logs", async () => {
    // get the log view
    const logViewRes = await supertest(server)
      .get("/log/logView")
      .query({
        projectId: projectM.id,
      })
      .expect(200);
    expect(logViewRes.body.length).toBe(1);
    const logView = logViewRes.body.at(0);
    const logViewLogsRes =await getLogViewLogs(server,logView,projectM);
    expect(logViewLogsRes.body.length).toBe(4);
    const simpleFilterM = createSimpleFilter();
    simpleFilterM.condition = LogFilterCondition.CONTAINS;
    simpleFilterM.property = "req.headers.token";
    simpleFilterM.value = "abc";
    await logFilterCreation(server,simpleFilterM,logView.id,projectM.id);
    const logViewLogsRes2 =await getLogViewLogs(server,logView,projectM);
    expect(logViewLogsRes2.body.length).toBe(2);


    simpleFilterM.value = "opq";
    await logFilterUpdateAction(server,simpleFilterM,logView.id,projectM.id);
    const logViewLogsRes3 =await getLogViewLogs(server,logView,projectM);
    expect(logViewLogsRes3.body.length).toBe(1);

    await logFilterDeletion(server,simpleFilterM.id,logView.id,projectM.id);
    const logViewLogsRes4 =await getLogViewLogs(server,logView,projectM);
    expect(logViewLogsRes4.body.length).toBe(4);

  });
});


async function getLogViewLogs(server:express.Express,logView,projectM:ProjectM){
    return supertest(server).get(
        `/log/logViewLogs/${logView.id}`
    ).query({projectId: projectM.id});
}
