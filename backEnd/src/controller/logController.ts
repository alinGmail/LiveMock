import {Collection} from "lokijs";
import {ExpectationM} from "core/struct/expectation";
import {getExpectationDb, getLogDb} from "../db/dbManager";
import express, {Request, Response} from "express";
import {addCross, ServerError, toAsyncRouter} from "./common";
import {ListLogPathParam, ListLogReqBody, ListLogReqQuery} from "core/struct/params/LogParams";
import {LogM} from "../../../core/struct/log";

const PAGE_SIZE = 100;

async function getCollection(
    projectId: string,
    path: string
): Promise<Collection<LogM>> {
    const db = await getLogDb(projectId, path);
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
            Array<LogM>,
            ListLogReqBody,
            ListLogReqQuery>,
        res:Response<Array<LogM>>
    )=>{
        addCross(res);
        const projectId = req.query.projectId;
        if (!projectId) {
            throw new ServerError(400, "project id not exist!");
        }
        const collection = await getCollection(projectId,path);
        const chain = collection.chain();
        const maxLogId = req.query.maxLogId;
        if(maxLogId === undefined || maxLogId === null){
        }else{
            chain.find({id:{'$lt':maxLogId}})
        }
        const logs = chain.find({}).simplesort("id",{desc:true}).limit(PAGE_SIZE).data();
        res.json(logs);
    });



    return router;
}