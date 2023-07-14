
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
};

export const createProjectReq = async (
    param: CreateProjectReqBody
): Promise<CreateProjectResponse> => {
  return window.api.project.createProject({},{},param);
};


export const updateProjectReq = async (
  projectId: string,
  param: UpdateProjectReqBody
): Promise<UpdateProjectResponse> => {
  return window.api.project.updateProject({projectId},{},param);
};

export const startProjectReq = async (projectId: string) => {
  return window.api.project.startProject({projectId});
};

export const stopProjectReq = async (projectId: string) => {
  return window.api.project.stopProject({projectId});
};