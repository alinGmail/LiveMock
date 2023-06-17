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

export interface ListLogViewParam{

}

export interface ListLogViewReqBody{

}

export interface ListLogViewReqQuery{
    projectId:string;
}


/**
 * list logs by logView
 */

export interface ListLogViewLogsParam{

}

export interface ListLogViewLogsReqBody{

}

export interface ListLogViewLogsReqQuery{
    projectId:string;
    lovViewId:string;
    maxLogId:string|null;
}
