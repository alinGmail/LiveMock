import * as superagent from "superagent";
import { ServerUrl } from "../config";
import { ListExpectationResponse } from "core/struct/response/ExpectationResponse";
import {
  CreateProjectReqBody,
  UpdateProjectReqBody,
} from "core/struct/params/ProjectParams";
import {
  CreateProjectResponse,
  ListProjectResponse,
  UpdateProjectResponse,
} from "core/struct/response/ProjectResponse";

export const getProjectListReq = async (): Promise<ListProjectResponse> => {
  const res = await superagent.get(`${ServerUrl}/project/`);
  return res.body;
};

export const createProjectReq = async (
  param: CreateProjectReqBody
): Promise<CreateProjectResponse> => {
  const res = await superagent.post(`${ServerUrl}/project/`).send(param);
  return res.body;
};

export const updateProjectReq = async (
  projectId: string,
  param: UpdateProjectReqBody
): Promise<UpdateProjectResponse> => {
  const res = await superagent.put(`${ServerUrl}/project/${projectId}`)
    .send(param);
  return res.body;
};

export const deleteProjectReq = async (projectId: string): Promise<void> => {
  const res = await superagent.delete(`${ServerUrl}/project/${projectId}`);
  return res.body;
}

export const startProjectReq = async (projectId: string) => {
  const res = await superagent.post(`${ServerUrl}/project/start/${projectId}`);
  return res.body;
};

export const stopProjectReq = async (projectId: string) => {
  const res = await superagent.post(`${ServerUrl}/project/stop/${projectId}`);
  return res.body;
};
