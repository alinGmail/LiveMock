import * as superagent from "superagent";
import { ServerUrl } from "../config";
import { ListExpectationResponse } from "core/struct/response/ExpectationResponse";
import { CreateProjectReqBody } from "core/struct/params/ProjectParams";
import { CreateProjectResponse } from "core/struct/response/ProjectResponse";

export const getProjectListReq = async (): Promise<ListExpectationResponse> => {
  const res = await superagent.get(`${ServerUrl}/project/`);
  return res.body;
};

export const createProjectReq = async (
  param: CreateProjectReqBody
): Promise<CreateProjectResponse> => {
  const res = await superagent.post(`${ServerUrl}/project/`).send(param);
  return res.body;
};


export const startProjectReq = async (projectId:string)=>{
  const res = await superagent.post(`${ServerUrl}/project/start/${projectId}`);
  return res.body;
}
