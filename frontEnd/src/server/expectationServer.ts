import {
  CreateExpectationParam,
  UpdateExpectationParam,
} from "core/struct/params/ExpectationParams";
import { ExpectationM } from "core/struct/expectation";
import * as superagent from "superagent";
import { ServerUrl } from "../config";
import { CreateExpectationResponse } from "core/struct/response/ExpectationResponse";

export const createExpectationReq = async (
  projectId: string,
  expectation: ExpectationM
): Promise<CreateExpectationResponse> => {
  const param: CreateExpectationParam = {
    projectId,
    expectation,
  };
  const res = await superagent.post(`${ServerUrl}/expectation/`).send(param);
  return res.body;
};

export const updateExpectationResponse = async (
  projectId: string,
  expectationId: string,
  updateQuery: any
) => {
  const param: UpdateExpectationParam = {
    projectId,
    updateQuery,
  };
  const res = await superagent
    .put(`${ServerUrl}/expectation/${expectationId}`)
    .send(param);
  return res.body;
};
