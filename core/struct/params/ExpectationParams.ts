import {ExpectationM} from "../expectation";


export interface CreateExpectationParam{
    expectation:ExpectationM,
    projectId:string;
}

export interface UpdateExpectationParam{
    updateQuery:any;
    projectId:string;
}

export interface ExpectationDetailParam{
    projectId:string;
}

