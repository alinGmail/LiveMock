import { ExpectationGroupM } from "livemock-core/struct/expectationGroup";
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
  return window.api.group.createGroup({}, {}, param);
};

export const listGroupReq = async (
  projectId: string
): Promise<ListExpectationGroupResponse> => {
  return window.api.group.listGroup({}, { projectId }, {});
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
  return window.api.group.updateGroup({ groupId }, {}, param);
};

export const deleteGroupReq = async (projectId: string, groupId: string) => {
  return window.api.group.deleteGroup({ groupId }, { projectId }, {});
};
