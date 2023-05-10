import { RequestMatcherM } from "../matcher";


/**
 * create matcher
 */
export interface CreateMatcherPathParam{

}

export interface CreateMatcherReqBody{
  projectId: string;
  expectationId: string;
  matcher: RequestMatcherM;
}

export interface CreateMatcherReqQuery{

}

/**
 * list matcher
 */
export interface ListMatcherPathParam{

}

export interface ListMatcherReqBody{

}

export interface ListMatcherReqQuery{

}

/**
 * update matcher
 */
export interface UpdateMatcherPathParam{
  matcherId:string;
}

export interface UpdateMatcherReqBody{
  projectId:string;
  expectationId:string;
  matcherUpdate:Partial<RequestMatcherM>;
}

export interface UpdateMatcherReqQuery{

}

/**
 * delete matcher
 */
export interface DeleteMatcherPathParam{
  matcherId:string;
}

export interface DeleteMatcherReqBody{

}

export interface DeleteMatcherReqQuery{
  projectId:string;
  expectationId:string;
}

