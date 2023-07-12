import {
  CreateActionReqBody,
  CreateActionReqQuery,
  DeleteActionReqQuery,
  UpdateActionReqBody,
} from "core/struct/params/ActionParams";
import { CreateActionResponse } from "core/struct/response/ActionResponse";

export const createActionReq = async (
  params: CreateActionReqBody
): Promise<CreateActionResponse> => {
  return window.api.action.createAction({}, {}, params);
};

export const deleteActionReq = async (
  actionId: string,
  query: DeleteActionReqQuery
) => {
  return window.api.action.deleteAction({actionId}, query, {});
};

export const updateActionReq = async (
  actionId: string,
  params: UpdateActionReqBody
) => {
  return window.api.action.updateAction({actionId}, {}, params);
};
