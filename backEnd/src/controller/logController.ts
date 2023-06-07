import {Collection} from "lokijs";
import {ExpectationM} from "core/struct/expectation";
import {getDb, getExpectationDb, getLogDb} from "../db/dbManager";
import express, {Request, Response} from "express";
import {addCross, ServerError, toAsyncRouter} from "./common";
import {
    ListLogPathParam,
    ListLogReqBody,
    ListLogReqQuery,
    ListLogViewParam,
    ListLogViewReqBody, ListLogViewReqQuery
} from "core/struct/params/LogParams";
import {LogM} from "core/struct/log";
import {Server, Socket} from "socket.io";
import {getLogCollection} from "../log/logUtils";
import {ListLogViewResponse} from "core/struct/response/LogResponse";

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


    /**
     * list the log view
     */
    router.get("/logView",async (
        req:Request<
            ListLogViewParam,
            ListLogViewResponse,
            ListLogViewReqBody,
            ListLogViewReqQuery
            >,
        res:Response<ListLogViewResponse>
    )=>{
        addCross(res);
        const projectId = req.query.projectId;
        if(!projectId){
            throw new ServerError(400, "project id not exist!");
        }
        const logViewDb = await getDb(projectId,path,"log");
        const logViewCollection = logViewDb.getCollection('logView');
        const logViews = logViewCollection.find({});
        res.json(logViews);
    });




    return router;
}






export async function addLogListener(io:Server,path:string){
    io.on('connection',async (socket)=>{
        //console.log("connect");
        //console.log(socket.id);
        const { projectId } = socket.handshake.query;
        const logDb = await getLogDb(projectId as string, path);
        const logCollection = await getLogCollection(projectId as string, path);

        //console.log(projectId);
        socket.on('disconnect', () => {
            console.log(` disconnected`);
        });
        const chain = logCollection.chain();
        const logs = chain.find({}).simplesort("id",{desc:true}).limit(PAGE_SIZE).data();
        socket.on('initLogsReq',(args)=>{
            socket.emit('initLogsRes',logs);
        });


    });
    io.on("disconnect",(socket)=>{
        console.log("disconnect");
    })
    io.on('setProjectId',(args => {

    }));
}