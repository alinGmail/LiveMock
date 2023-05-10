import { ProjectM } from "../project";

/**
 * create project
 */
export interface CreateProjectPathParam {}

export interface CreateProjectReqBody {
  project: ProjectM;
}

export interface CreateProjectReqQuery {}

/**
 * get project
 */
export interface GetProjectPathParam {}

export interface GetProjectReqBody {}

export interface GetProjectReqQuery {}

/**
 * list project
 */
export interface ListProjectPathParam {}

export interface ListProjectReqBody {}

export interface ListProjectReqQuery {}

/**
 * update project
 */
export interface UpdateProjectPathParam {
  projectId: string;
}

export interface UpdateProjectReqBody {
  projectUpdate: Partial<ProjectM>;
}

export interface UpdateProjectReqQuery {}
