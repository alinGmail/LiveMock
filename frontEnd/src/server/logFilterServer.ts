import {
  CreateLogFilterReqBody,
  DeleteLogFilterReqQuery,
  UpdateLogFilterReqBody,
  UpdatePresetLogFilterReqBody
} from "livemock-core/struct/params/LogFilterParam";
import * as superagent from "superagent";

export const addLogFilterReq = async (param:CreateLogFilterReqBody)=>{
    const response = await superagent.post(`/logFilter/`)
        .send(param);
    return response.body;
}

export const updateLogFilterReq = async (
  logFilterId: string,
  param: UpdateLogFilterReqBody
) => {
  const response = await superagent
    .post(`/logFilter/${logFilterId}`)
    .send(param);
  return response.body;
};

export const updatePresetLogFilterReq = async (param:UpdatePresetLogFilterReqBody)=> {
  const response = await superagent.post(`/logFilter/updatePresetLogFilter`).send(param);
  return response.body;
}

export const deleteLogFilterReq = async (logFilterId:string,param:DeleteLogFilterReqQuery)=>{
    const response = await superagent.delete(`/logFilter/${logFilterId}`)
        .query(param);
    return response.body;
}

