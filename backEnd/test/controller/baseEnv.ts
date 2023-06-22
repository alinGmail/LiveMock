import express from "express";
import {projectCreation, routerSetup} from "./common";
import {createProject, ProjectM} from "core/struct/project";


let projectM:ProjectM = createProject();
projectM.name = "test project";
export async function setUpBaseEnv(server:express.Express){
    await routerSetup(server);
    await projectCreation(server, projectM);

}

export function getBaseEnvProject(){
    return projectM;
}

