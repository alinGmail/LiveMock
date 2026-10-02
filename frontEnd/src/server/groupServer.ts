import { ExpectationGroupM } from "livemock-core/struct/expectationGroup";
import * as superagent from "superagent";
import { ServerUrl } from "../config";
import {
  CreateExpectationGroupReqBody,
  UpdateExpectationGroupReqBody,
} from "livemock-core/struct/params/ExpectationGroupParams";
import {
  CreateExpectationGroupResponse,
  ListExpectationGroupResponse,
} from "livemock-core/struct/response/ExpectationGroupResponse";

export const createGroupReq = async (
  projectId: string,
  group: ExpectationGroupM
): Promise<CreateExpectationGroupResponse> => {
  const param: CreateExpectationGroupReqBody = {
    projectId,
    group,
  };
  const res = await superagent.post(`${ServerUrl}/group/`).send(param);
  return res.body;
};

export const listGroupReq = async (
  projectId: string
): Promise<ListExpectationGroupResponse> => {
  const res = await superagent.get(
    `${ServerUrl}/group/?projectId=${projectId}`
  );
  return res.body;
};

export const updateGroupReq = async (
  projectId: string,
  groupId: string,
  groupUpdate: Partial<ExpectationGroupM>
) => {
  const param: UpdateExpectationGroupReqBody = {
    projectId,
    groupUpdate,
  };
  const res = await superagent
    .put(`${ServerUrl}/group/${groupId}`)
    .send(param);
  return res.body;
};

export const deleteGroupReq = async (projectId: string, groupId: string) => {
  const res = await superagent
    .delete(`${ServerUrl}/group/${groupId}`)
    .query({ projectId });
  return res.body;
};
