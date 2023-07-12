
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
  return window.api.project.listProject({}, {}, {});
  //const res = await superagent.get(`${ServerUrl}/project/`);
};

export const createProjectReq = async (
    param: CreateProjectReqBody
): Promise<CreateProjectResponse> => {
  //const res = await superagent.post(`${ServerUrl}/project/`).send(param);
  //return res.body;
  return window.api.project.createProject({},{},param);
};


export const updateProjectReq = async (
  projectId: string,
  param: UpdateProjectReqBody
): Promise<UpdateProjectResponse> => {
  return window.api.project.updateProject();
  //const res = await superagent.put(`${ServerUrl}/project/${projectId}`)
  //  .send(param);
  //return res.body;
};

export const startProjectReq = async (projectId: string) => {
  //const res = await superagent.post(`${ServerUrl}/project/start/${projectId}`);
  //return res.body;
};

export const stopProjectReq = async (projectId: string) => {
  //const res = await superagent.post(`${ServerUrl}/project/stop/${projectId}`);
  //return res.body;
};