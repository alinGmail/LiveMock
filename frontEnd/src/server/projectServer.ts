import * as superagent from "superagent";
import { ServerUrl } from "../config";
import {CreateProjectResponse, ProjectListResponse} from "core/struct/response/ProjectListResponse";
import { CreateProjectParam } from "core/struct/params/ProjectParams";

export const getProjectListReq = async (): Promise<ProjectListResponse> => {
  const res = await superagent.get(`${ServerUrl}/project/`);
  if (res.status === 200) {
    return res.body;
  } else {
    throw new Error(res.body.message);
  }
};

export const createProjectReq = async (
  param: CreateProjectParam
): Promise<CreateProjectResponse> => {
  const res = await superagent.post(`${ServerUrl}/project/`).send(param);
  if (res.status === 200) {
    return res.body;
  } else {
    throw new Error(res.body.message);
  }
};
