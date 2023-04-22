export interface IProject{
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
}
