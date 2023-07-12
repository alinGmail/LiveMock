import {CreateMatcherResponse, UpdateMatcherResponse} from "core/struct/response/MatcherResponse";
import { DeleteMatcherResponse } from "core/struct/response/MatcherResponse";
import {
  CreateMatcherReqBody,
  UpdateMatcherReqBody,
} from "core/struct/params/MatcherParams";

export const createMatcherReq = async (
  param: CreateMatcherReqBody
): Promise<CreateMatcherResponse> => {
  return window.api.matcher.createMatcher({}, {}, param);
};

export const deleteMatcherReq = async ({
  matcherId,
  projectId,
  expectationId,
}: {
  matcherId: string;
  projectId: string;
  expectationId: string;
}): Promise<DeleteMatcherResponse> => {
  return window.api.matcher.deleteMatcher({matcherId},{projectId,expectationId},{})
};

export const updateMatcherReq = async (
  matcherId: string,
  param: UpdateMatcherReqBody
) :Promise<UpdateMatcherResponse>=> {
  return window.api.matcher.updateMatcher({matcherId},{},param);
};
