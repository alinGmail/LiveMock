/**
 * list log
 */
export interface ListLogPathParam{

}

export interface ListLogReqBody{

    
}

export interface ListLogReqQuery{
    maxLogId?:number;
    projectId:string;
}


/**
 * list log view
 */

export interface ListLogViewPathParam{

}

export interface ListLogViewReqBody{

}

export interface ListLogViewReqQuery{
    projectId:string;
}


/**
 * list logs by logView
 */

export interface ListLogViewLogsPathParam{
    logViewId:string;
}

export interface ListLogViewLogsReqBody{

}

export interface ListLogViewLogsReqQuery{
    projectId:string;
    maxLogId:string|null;
}
