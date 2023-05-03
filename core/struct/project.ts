export interface ProjectM{
    name: string;
    description: string;
    port: string;
    createDate: Date;
    status: ProjectStatus;
    error: boolean;
    errorMessage: string | null;
    _id?:string;
}


export enum ProjectStatus {
    STARTED = "STARTED",
    STOPPED = "STOPPED",
}

export function createProject():ProjectM{
    return {
        createDate: new Date(),
        description: "",
        error: false,
        errorMessage: null,
        name: "",
        port: "8088",
        status: ProjectStatus.STOPPED,
    }
}