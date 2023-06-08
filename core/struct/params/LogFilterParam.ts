/**
 * add log filter
 */
import {LogFilterM} from "../log";

export interface AddLogFilterParam{

}

export interface AddLogFilterReqBody{
    projectId:string;
    logViewId:string;
    filter:LogFilterM;
}

export interface AddLogFilterReqQuery{

}


/**
 * update log filter
 */
export interface UpdateLogFilterParam{
    logFilterId:string;
}

export interface UpdateLogFilterReqBody{
    projectId:string;
    logViewId:string;
    filter:LogFilterM;
}

export interface UpdateLogFilterReqQuery{

}


/**
 * delete log filter
 */
export interface DeleteLogFilterParam{
    logFilterId:string;
}

export interface DeleteLogFilterReqBody{

}

export interface DeleteLogFilterReqQuery{
    projectId:string;
    logViewId:string;
}