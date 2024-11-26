import {
  CreateLogFilterReqBody,
  DeleteLogFilterReqQuery,
  UpdateLogFilterReqBody,
  UpdatePresetLogFilterReqBody
} from "livemock-core/struct/params/LogFilterParam";

export const addLogFilterReq = async (param:CreateLogFilterReqBody)=>{
    return window.api.logFilter.createLogFilter({}, {}, param);
}

export const updateLogFilterReq = async (
  logFilterId: string,
  param: UpdateLogFilterReqBody
) => {
  return window.api.logFilter.updateLogFilter({logFilterId},{},param);
};

export const updatePresetLogFilterReq = async (param:UpdatePresetLogFilterReqBody)=> {
  return window.api.logFilter.updatePresetLogFilter({},{},param);
}

export const deleteLogFilterReq = async (logFilterId:string,param:DeleteLogFilterReqQuery)=>{
   return window.api.logFilter.deleteLogFilter({logFilterId},param,{});
}

