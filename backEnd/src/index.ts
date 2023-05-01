import express from "express";
import {getProjectRouter} from "./controller/projectController";
import {getExpectationRouter} from "./controller/expectationController";
import {CustomErrorMiddleware} from "./controller/common";


const server = express();
server.use("/project", getProjectRouter("dev_db"));
server.use("/expectation", getExpectationRouter("dev_db"));
server.use(CustomErrorMiddleware);


server.listen(9002,()=>{
    console.log('server start on 9002');
})
