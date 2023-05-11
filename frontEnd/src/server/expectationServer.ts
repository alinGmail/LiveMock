
import { ExpectationM } from "core/struct/expectation";
import * as superagent from "superagent";
import { ServerUrl } from "../config";
import {CreateExpectationResponse, ListExpectationResponse} from "core/struct/response/ExpectationResponse";
import {CreateExpectationReqBody, UpdateExpectationReqBody} from "core/struct/params/ExpectationParams";

export const createExpectationReq = async (
  projectId: string,
  expectation: ExpectationM
): Promise<CreateExpectationResponse> => {
  const param: CreateExpectationReqBody = {
    projectId,
    expectation,
  };
  const res = await superagent.post(`${ServerUrl}/expectation/`).send(param);
  return res.body;
};

export const updateExpectationReq = async (
  projectId: string,
  expectationId: string,
  expectationUpdate: Partial<ExpectationM>
) => {
  const param: UpdateExpectationReqBody = {
    projectId,
    expectationUpdate,
  };
  const res = await superagent
    .put(`${ServerUrl}/expectation/${expectationId}`)
    .send(param);
  return res.body;
};

export const getExpectationListReq = async (projectId: string):Promise<ListExpectationResponse> => {
  const res = await superagent.get(
    `${ServerUrl}/Expectation/?projectId=${projectId}`
  );
  return res.body;
};
