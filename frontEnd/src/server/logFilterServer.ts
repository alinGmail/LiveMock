import {
  CreateLogFilterReqBody,
  DeleteLogFilterReqQuery,
  UpdateLogFilterReqBody,
  UpdatePresetLogFilterReqBody
} from "core/struct/params/LogFilterParam";
import * as superagent from "superagent";
import {ServerUrl} from "../config";

export const addLogFilterReq = async (param:CreateLogFilterReqBody)=>{
    const response = await superagent.post(`${ServerUrl}/logFilter/`)
        .send(param);
    return response.body;
}

export const updateLogFilterReq = async (
  logFilterId: string,
  param: UpdateLogFilterReqBody
) => {
  const response = await superagent
    .post(`${ServerUrl}/logFilter/${logFilterId}`)
    .send(param);
  return response.body;
};

export const updatePresetLogFilterReq = async (param:UpdatePresetLogFilterReqBody)=> {
  const response = await superagent.post(`${ServerUrl}/logFilter/updatePresetLogFilter`).send(param);
  return response.body;
}

export const deleteLogFilterReq = async (logFilterId:string,param:DeleteLogFilterReqQuery)=>{
    const response = await superagent.delete(`${ServerUrl}/logFilter/${logFilterId}`)
        .query(param);
    return response.body;
}

