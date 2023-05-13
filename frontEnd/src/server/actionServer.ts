import * as superagent from "superagent";
import {CreateActionReqBody, CreateActionReqQuery} from "core/struct/params/ActionParams";
import { CreateActionResponse } from "core/struct/response/ActionResponse";
import { ServerUrl } from "../config";

export const createActionReq = async (
  params: CreateActionReqBody
): Promise<CreateActionResponse> => {
  const res = await superagent.post(`${ServerUrl}/action`).send(params);
  return res.body;
};


