
import { ExpectationM } from "livemock-core/struct/expectation";
import {CreateExpectationResponse, ListExpectationResponse} from "livemock-core/struct/response/ExpectationResponse";
import {CreateExpectationReqBody, UpdateExpectationReqBody} from "livemock-core/struct/params/ExpectationParams";

export const createExpectationReq = async (
  projectId: string,
  expectation: ExpectationM
): Promise<CreateExpectationResponse> => {
  const param: CreateExpectationReqBody = {
    projectId,
    expectation,
  };
  return window.api.expectation.createExpectation({}, {}, param)
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
  return window.api.expectation.updateExpectation({expectationId},{},param);
};

export const listExpectationListReq = async (projectId: string):Promise<ListExpectationResponse> => {
  return window.api.expectation.listExpectation({},{projectId},{});
};

export const deleteExpectationReq = async (projectId:string,expectationId:string) =>{
  return window.api.expectation.deleteExpectation({expectationId},{projectId},{});
}
