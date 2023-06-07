import {Request, Response} from "express";
import {AddLogFilterResponse} from "core/struct/response/LogFilterResponse";
import {
    AddLogFilterParam,
    AddLogFilterReqBody,
    AddLogFilterReqQuery, DeleteLogFilterParam, DeleteLogFilterReqBody, DeleteLogFilterReqQuery,
    UpdateLogFilterParam, UpdateLogFilterReqBody, UpdateLogFilterReqQuery
} from "core/struct/params/LogFilterParam";
import {addCross, ServerError} from "./common";
import {getLogViewDb} from "../db/dbManager";
import {LogViewM} from "../../../core/struct/logView";
import {DeleteLogFilterResponse, UpdateLogFilterResponse} from "../../../core/struct/response/LogFilterResponse";

let path = ""

async function addLogFilter(req:Request<
    AddLogFilterParam,
    AddLogFilterResponse,
    AddLogFilterReqBody,
    AddLogFilterReqQuery
    >,res:Response<AddLogFilterResponse>){
    addCross(res);
    let {filter, logViewId, projectId} = req.body;
    if (!projectId) {
        throw new ServerError(400, "project id not exist!");
    }
    const logViewDb = await getLogViewDb(projectId, path);
    const collection = logViewDb.getCollection<LogViewM>("logView");
    const logView = collection.findOne({id:logViewId});
    if(!logView){
        throw new ServerError(400, "logView not exist!");
    }
    logView.filters.push(filter);
    res.json({message:"success"});
}


async function updateFilter(req:Request<
    UpdateLogFilterParam,
    UpdateLogFilterResponse,
    UpdateLogFilterReqBody,
    UpdateLogFilterReqQuery
    >,res:Response<UpdateLogFilterResponse>){
    addCross(res);
    let {filter, logViewId, projectId} = req.body;
    if (!projectId) {
        throw new ServerError(400, "project id not exist!");
    }
    const logViewDb = await getLogViewDb(projectId, path);
    const collection = logViewDb.getCollection<LogViewM>("logView");
    const logView = collection.findOne({id:logViewId});
    if(!logView){
        throw new ServerError(400, "logView not exist!");
    }
    const findIndex = logView.filters.findIndex(item => item.id === filter.id);
    if(findIndex === -1){
        throw new ServerError(400, "filter not exist!");
    }
    logView.filters[findIndex] = filter;
    collection.update(logView);
    res.json({message:"success"});
}


async function deleteFilter(req:Request<
    DeleteLogFilterParam,
    DeleteLogFilterResponse,
    DeleteLogFilterReqBody,
    DeleteLogFilterReqQuery
    >,res:Response<DeleteLogFilterResponse>){
    addCross(res);
    let {filterId, logViewId, projectId} = req.query;
    if (!projectId) {
        throw new ServerError(400, "project id not exist!");
    }
    const logViewDb = await getLogViewDb(projectId, path);
    const collection = logViewDb.getCollection<LogViewM>("logView");
    const logView = collection.findOne({id:logViewId});
    if(!logView){
        throw new ServerError(400, "logView not exist!");
    }
    logView.filters = logView.filters.filter(item => item.id !== filterId);
    collection.update(logView);
    res.json({message:"success"});
}

