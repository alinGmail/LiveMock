
import { ExpectationM } from "livemock-core/struct/expectation";
import * as superagent from "superagent";
import { ServerUrl } from "../config";
import {CreateExpectationResponse, ListExpectationResponse} from "livemock-core/struct/response/ExpectationResponse";
import {CreateExpectationReqBody, UpdateExpectationReqBody} from "livemock-core/struct/params/ExpectationParams";
import type { BatchImportOptions, BatchImportReqBody, BatchImportResult } from "livemock-core/import/types";

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

export const listExpectationReq = async (projectId: string):Promise<ListExpectationResponse> => {
  const res = await superagent.get(
    `${ServerUrl}/expectation/?projectId=${projectId}`
  );
  return res.body;
};

export const deleteExpectationReq = async (projectId:string,expectationId:string) =>{
  const res = await superagent.delete(`${ServerUrl}/expectation/${expectationId}`)
      .query({projectId:projectId});
  return res.body;
}

export const batchImportExpectationReq = async (
  projectId: string,
  content: string,
  options?: BatchImportOptions
): Promise<BatchImportResult> => {
  const param: BatchImportReqBody = {
    projectId,
    content,
    options,
  };
  const res = await superagent
    .post(`${ServerUrl}/expectation/batchImport`)
    .send(param);
  return res.body;
};
