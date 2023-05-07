import * as superagent from "superagent";
import { CreateMatcherResponse } from "core/struct/response/MatcherResponse";
import { CreateMatcherParams } from "core/struct/params/MatcherParams";
import { ServerUrl } from "../config";
import { DeleteMatcherResponse } from "../../../core/struct/response/MatcherResponse";

export const createMatcherReq = async (
  param: CreateMatcherParams
): Promise<CreateMatcherResponse> => {
  const res = await superagent.post(`${ServerUrl}/matcher`).send(param);
  return res.body;
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
  const response = await superagent.delete(
    `${ServerUrl}/matcher/${matcherId}?projectId=${projectId}&expectationId=${expectationId}`
  );
  return response.body;
};
