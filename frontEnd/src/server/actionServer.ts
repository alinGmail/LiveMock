import * as superagent from "superagent";
import {
  CreateActionReqBody,
  CreateActionReqQuery,
  DeleteActionReqQuery,
} from "core/struct/params/ActionParams";
import { CreateActionResponse } from "core/struct/response/ActionResponse";
import { ServerUrl } from "../config";

export const createActionReq = async (
  params: CreateActionReqBody
): Promise<CreateActionResponse> => {
  const res = await superagent.post(`${ServerUrl}/action`).send(params);
  return res.body;
};

export const deleteActionReq = async (
  actionId: string,
  query: DeleteActionReqQuery
) => {
  const res = await superagent
    .delete(`${ServerUrl}/action/${actionId}`)
    .query(query);
  return res.body;
};
