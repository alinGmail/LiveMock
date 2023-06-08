import {ListLogViewReqQuery} from "core/struct/params/LogParams";
import * as superagent from "superagent";
import {ServerUrl} from "../config";
import {ListLogViewResponse} from "core/struct/response/LogResponse";

export async function getLogViewReq (
    query:ListLogViewReqQuery
):Promise<ListLogViewResponse>{
    const response = await superagent.get(`${ServerUrl}/log/logView`)
        .query(query);
    return response.body;
}


