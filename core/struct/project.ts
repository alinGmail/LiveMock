import { v4 as uuId } from "uuid";

export interface ProjectM{
    id:string;
    name: string;
    description: string;
    port: string;
    createDate: Date;
    status: ProjectStatus;
    error: boolean;
    errorMessage: string | null;
}


export enum ProjectStatus {
    STARTED = "STARTED",
    STOPPED = "STOPPED",
    STARTING = "STARTING",
    CLOSING = "CLOSING"
}

export function createProject():ProjectM{
    return {
        id:uuId(),
        createDate: new Date(),
        description: "",
        error: false,
        errorMessage: null,
        name: "",
        port: "8088",
        status: ProjectStatus.STOPPED,
    }
}
