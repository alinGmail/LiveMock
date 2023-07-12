import {
  CreateProjectPathParam, CreateProjectReqBody, CreateProjectReqQuery,
  ListProjectPathParam,
  ListProjectReqBody,
  ListProjectReqQuery
} from "core/struct/params/ProjectParams";
import {CreateProjectResponse, ListProjectResponse} from "core/struct/response/ProjectResponse";
import * as electron from "electron";
import {ProjectEvents} from "core/struct/events/desktopEvents";
const ipcRenderer = electron.ipcRenderer;



// ----------------------------------------------------------------------



export const api = {
  project:{
    listProject:(reqParam:ListProjectPathParam,reqQuery:ListProjectReqQuery,reqBody:ListProjectReqBody):Promise<ListProjectResponse> => {
      return ipcRenderer.invoke(ProjectEvents.ListProject,reqParam,reqQuery,reqBody);
    },
    createProject:(reqParam:CreateProjectPathParam,reqQuery:CreateProjectReqQuery,reqBody:CreateProjectReqBody):Promise<CreateProjectResponse>=>{
      return ipcRenderer.invoke(ProjectEvents.CreateProject,reqParam,reqQuery,reqBody);
    },
    log:()=>{
      console.log("abcdefgasdf")
    }
  }
}

electron.contextBridge.exposeInMainWorld("api",api);


