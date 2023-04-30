import express from "express";
import {getProjectRouter} from "../../src/controller/projectController";
import {createProject} from "../../../core/struct/project";
import request from "supertest";
import {createExpectation} from "../../../core/struct/expectation";
import {getExpectationRouter} from "../../src/controller/expectationController";
import {CustomErrorMiddleware} from "../../src/controller/common";


test("expectation controller",async ()=>{
    const server = express(); //创建服务器
    server.use("/project", getProjectRouter("test_db"));
    server.use("/expectation",getExpectationRouter("test_db"));
    server.use(CustomErrorMiddleware);

    const projectM = createProject();
    projectM.name = "new Project";

    const res = await request(server)
        .post("/project/")
        .send({
            project: projectM,
        })
        .expect(200)
        .expect("Content-Type", /json/);

    // create expectation
    const expectationM = createExpectation();
    expectationM.name = 'text expectation';
    expectationM.priority = 200;

    //request(server).post("/expectation/")

    const errorRes = await request(server).post("/expectation/").expect(400);

    expect(errorRes.body.error.message).toEqual("project id not exist!");

});