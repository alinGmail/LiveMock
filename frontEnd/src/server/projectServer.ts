import * as superagent from "superagent";
import { ListExpectationResponse } from "livemock-core/struct/response/ExpectationResponse";
import {
  CreateProjectReqBody,
  UpdateProjectReqBody,
} from "livemock-core/struct/params/ProjectParams";
import {
  CreateProjectResponse,
  ListProjectResponse,
  UpdateProjectResponse,
} from "livemock-core/struct/response/ProjectResponse";

export const getProjectListReq = async (): Promise<ListProjectResponse> => {
  const res = await superagent.get(`/project/`);
  return res.body;
};

export const createProjectReq = async (
  param: CreateProjectReqBody
): Promise<CreateProjectResponse> => {
  const res = await superagent.post(`/project/`).send(param);
  return res.body;
};

export const updateProjectReq = async (
  projectId: string,
  param: UpdateProjectReqBody
): Promise<UpdateProjectResponse> => {
  const res = await superagent.put(`/project/${projectId}`)
    .send(param);
  return res.body;
};

export const deleteProjectReq = async (projectId: string): Promise<void> => {
  const res = await superagent.delete(`/project/${projectId}`);
  return res.body;
}

export const startProjectReq = async (projectId: string) => {
  const res = await superagent.post(`/project/start/${projectId}`);
  return res.body;
};

export const stopProjectReq = async (projectId: string) => {
  const res = await superagent.post(`/project/stop/${projectId}`);
  return res.body;
};
