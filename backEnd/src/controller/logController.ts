import {Collection} from "lokijs";
import {ExpectationM} from "core/struct/expectation";
import {getExpectationDb} from "../db/dbManager";
import express, {Request} from "express";
import {addCross, ServerError, toAsyncRouter} from "./common";
import {ListLogPathParam, ListLogReqBody, ListLogReqQuery} from "core/struct/params/LogParams";


async function getCollection(
    projectId: string,
    path: string
): Promise<Collection<ExpectationM>> {
    const db = await getExpectationDb(projectId, path);
    return db.getCollection("log");
}

export async function getLogRouter(path:string):Promise<express.Router>{
    let router = toAsyncRouter(express());
    router.options("*", (req, res) => {
        addCross(res);
        res.end();
    });

    /**
     * list the log
     */
    router.get("/",async (
        req:Request<
            ListLogPathParam,
            {},
            ListLogReqBody,
            ListLogReqQuery>,res
    )=>{
        addCross(res);
        const projectId = req.body.projectId;
        if (!projectId) {
            throw new ServerError(400, "project id not exist!");
        }
        const collection = await getCollection(projectId,path);
        const logs = collection.find({});
        res.json(logs);
    })



    return router;
}