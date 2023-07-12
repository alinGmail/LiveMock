import {ProjectEvents} from "core/struct/events/desktopEvents";
import * as electron from "electron";
import {
    CreateProjectPathParam, CreateProjectReqBody, CreateProjectReqQuery,
    ListProjectPathParam,
    ListProjectReqBody,
    ListProjectReqQuery
} from "core/struct/params/ProjectParams";
import {ProjectM} from "core/struct/project";
import { Collection } from "lokijs";
import {getLogViewCollection, getProjectCollection} from "../db/dbManager";
import {getProjectStatus} from "../server/projectStatusManage";
import {isNotEmptyString} from "../common/utils.ts";
import {ServerError} from "./common.ts";
import {createLogView} from "core/struct/logView.ts";


const ipcMain = electron.ipcMain;

export async function setProjectHandler(path:string):Promise<void> {
    const collection: Collection<ProjectM> = await getProjectCollection(path);

    /**
     * list project
     */
    ipcMain.handle(ProjectEvents.ListProject,(event,reqParam:ListProjectPathParam,reqQuery:ListProjectReqQuery,reqBody:ListProjectReqBody)=> {
        const projects = collection.find({});
        projects.forEach((project) => {
            const projectStatus = getProjectStatus(project.id);
            project.status = projectStatus;
        });
        return projects;
    });

    ipcMain.handle(ProjectEvents.CreateProject,  async (event,reqParam:CreateProjectPathParam,reqQuery:CreateProjectReqQuery,reqBody:CreateProjectReqBody)=>{

        if(reqBody.project){
            if(!isNotEmptyString(reqBody.project.name)){
                throw new ServerError(400,"project name can not be empty");
            }
            const project = collection.insert(reqBody.project);
            const logViewMCollection = await getLogViewCollection(project!.id,path);
            logViewMCollection.insert(createLogView());
            return reqBody.project;
        }else{
          throw new ServerError(400,"invalid Request param");
        }
    });

    return ;
}

