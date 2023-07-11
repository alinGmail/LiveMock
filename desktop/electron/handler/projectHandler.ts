import {ProjectEvents} from "core/struct/events/desktopEvents";
import ipcMain = Electron.ipcMain;
import {ListProjectPathParam, ListProjectReqBody, ListProjectReqQuery} from "core/struct/params/ProjectParams";
import {ProjectM} from "core/struct/project";
import { Collection } from "lokijs";
import {getProjectCollection} from "../db/dbManager";
import {getProjectStatus} from "../server/projectStatusManage";

export async function setProjectHandler(path:string):Promise<void> {
    const collection: Collection<ProjectM> = await getProjectCollection(path);

    ipcMain.handle(ProjectEvents.ListProject,(reqParam:ListProjectPathParam,reqQuery:ListProjectReqQuery,reqBody:ListProjectReqBody)=> {
        const projects = collection.find({});
        projects.forEach((project) => {
            const projectStatus = getProjectStatus(project.id);
            project.status = projectStatus;
        });
        return projects;
    })
    return ;
}

