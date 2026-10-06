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
    unclosedWebsocketRequestLogIds: Array<number>;
    maxRequestLogNumber: number;
}

export const DEFAULT_MAX_REQUEST_LOG_NUMBER = 5000;
export const MIN_MAX_REQUEST_LOG_NUMBER = 1000;

/**
 * The effective maximum number of request logs a project keeps. Legacy projects
 * may not have the field persisted, so this falls back to the default, and
 * clamps anything below the minimum up to the minimum.
 */
export function getMaxRequestLogNumber(project: { maxRequestLogNumber?: number }): number {
    const value = project?.maxRequestLogNumber;
    if (typeof value !== "number" || !isFinite(value)) {
        return DEFAULT_MAX_REQUEST_LOG_NUMBER;
    }
    return Math.max(MIN_MAX_REQUEST_LOG_NUMBER, Math.floor(value));
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
        unclosedWebsocketRequestLogIds:[],
        maxRequestLogNumber: DEFAULT_MAX_REQUEST_LOG_NUMBER,
    }
}
