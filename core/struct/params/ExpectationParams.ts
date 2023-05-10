import {ExpectationM} from "../expectation";


/**
 * create expectation
 */
export interface CreateExpectationPathParam{

}

export interface CreateExpectationReqBody{
    expectation:ExpectationM,
    projectId:string;
}

export interface CreateExpectationReqQuery{

}

/**
 * list expectation
 */
export interface ListExpectationPathParam{

}

export interface ListExpectationReqBody{

}

export interface ListExpectationReqQuery{
    projectId: string
}



export interface UpdateExpectationParam{
    updateQuery:any;
    projectId:string;
}

export interface ExpectationDetailParam{
}

