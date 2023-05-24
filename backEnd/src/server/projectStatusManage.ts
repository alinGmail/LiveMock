import {ProjectStatus} from "core/struct/project";
import express from "express";
import getMockRouter from "./mockServer";


let projectStatusMap = new Map<string,ProjectStatus>();
let projectServerMap = new Map<string,express.Express>();

export function getProjectStatus(projectId:string){
    const projectStatus = projectStatusMap.get(projectId);

    if(projectStatus === null){
        return ProjectStatus.STOPPED;
    }else{
        return projectStatus;
    }

}

export function setProjectStatus(projectId:string,projectStatus:ProjectStatus){
    projectStatusMap.set(projectId,projectStatus);
}




export async function getProjectServer(projectId:string,path:string){
    let server = projectServerMap.get(projectId);
    if(server == null){
        server = express();
        server.all("*",await getMockRouter(path,projectId));
        projectServerMap.set(projectId,server);
    }
    return server;
}


