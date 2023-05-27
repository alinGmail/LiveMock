import {ProjectStatus} from "core/struct/project";
import * as http from "http";


let projectStatusMap = new Map<string,ProjectStatus>();
let projectServerMap = new Map<string,http.Server>();

export function getProjectStatus(projectId:string):ProjectStatus{
    const projectStatus = projectStatusMap.get(projectId);

    if(projectStatus == null){
        return ProjectStatus.STOPPED;
    }else{
        return projectStatus;
    }

}

export function setProjectStatus(projectId:string,projectStatus:ProjectStatus){
    projectStatusMap.set(projectId,projectStatus);
}




export  function getProjectServer(projectId:string,path:string):http.Server|undefined{
    return projectServerMap.get(projectId);
}

export function setProjectServer(projectId:string,server:http.Server){
    projectServerMap.set(projectId,server);
}

