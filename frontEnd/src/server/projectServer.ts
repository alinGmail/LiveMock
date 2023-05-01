import * as superagent from "superagent";
import { ServerUrl } from "../config";
import { ProjectListResponse } from "../../../core/struct/response/ProjectListResponse";

export const getProjectList = async (): Promise<ProjectListResponse> => {
  const res = await superagent.get(`${ServerUrl}/project/`);
  if (res.status === 200) {
    return res.body;
  } else {
    throw new Error(res.body.message);
  }
};
