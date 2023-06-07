import {LogFilterM} from "./log";
import { v4 as uuId } from "uuid";

export interface LogViewM{
    id:string;
    name:string;
    filters:Array<LogFilterM>;
}

export function createLogView():LogViewM{
    return {
        id:uuId(),
        name:"",
        filters:[]
    }
}