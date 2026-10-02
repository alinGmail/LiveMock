import * as superagent from "superagent";
import {
  CreateActionReqBody,
  CreateActionReqQuery,
  DeleteActionReqQuery,
  UpdateActionReqBody,
} from "livemock-core/struct/params/ActionParams";
import { CreateActionResponse } from "livemock-core/struct/response/ActionResponse";

export const createActionReq = async (
  params: CreateActionReqBody
): Promise<CreateActionResponse> => {
  const res = await superagent.post(`/action`).send(params);
  return res.body;
};

export const deleteActionReq = async (
  actionId: string,
  query: DeleteActionReqQuery
) => {
  const res = await superagent
    .delete(`/action/${actionId}`)
    .query(query);
  return res.body;
};

export const updateActionReq = async (
  actionId: string,
  params: UpdateActionReqBody
) => {
  const res = await superagent
    .put(`/action/${actionId}`)
    .send(params);
  return res.body;
};
