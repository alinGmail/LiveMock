import * as superagent from "superagent";
import {
  CreateActionReqBody,
  CreateActionReqQuery,
  DeleteActionReqQuery,
  UpdateActionReqBody,
} from "livemock-core/struct/params/ActionParams";
import { CreateActionResponse } from "livemock-core/struct/response/ActionResponse";
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

export const updateActionReq = async (
  actionId: string,
  params: UpdateActionReqBody
) => {
  const res = await superagent
    .put(`${ServerUrl}/action/${actionId}`)
    .send(params);
  return res.body;
};
