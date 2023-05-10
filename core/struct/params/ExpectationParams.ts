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


/**
 * update expectation
 */
export interface UpdateExpectationPathParam{
    expectationId: string;
}

export interface UpdateExpectationReqBody{
    expectationUpdate:Partial<ExpectationM>;
    projectId:string;
}

export interface UpdateExpectationReqQuery{

}

/**
 * get expectation
 */
export interface GetExpectationPathParam{
    expectationId:string
}

export interface GetExpectationReqBody{

}

export interface GetExpectationReqQuery{
    projectId:string;
}

/**
 * delete expectation
 */
export interface DeleteExpectationPathParam{
    expectationId: string;
}

export interface DeleteExpectationReqBody{

}

export interface DeleteExpectationReqQuery{
    projectId: string;
}


