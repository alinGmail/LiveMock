import * as superagent from "superagent";
import { ServerUrl } from "../config";
import {
  CreateProjectResponse,
  ProjectListResponse,
} from "core/struct/response/ProjectListResponse";
import { CreateProjectParam } from "core/struct/params/ProjectParams";

export const getProjectListReq = async (): Promise<ProjectListResponse> => {
  const res = await superagent.get(`${ServerUrl}/project/`);
  return res.body;
};

export const createProjectReq = async (
  param: CreateProjectParam
): Promise<CreateProjectResponse> => {
  const res = await superagent.post(`${ServerUrl}/project/`).send(param);
  return res.body;
};
