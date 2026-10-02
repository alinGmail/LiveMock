import { ExpectationGroupM } from "../expectationGroup";

/**
 * create expectation group
 */
export interface CreateExpectationGroupPathParam {}

export interface CreateExpectationGroupReqBody {
  group: ExpectationGroupM;
  projectId: string;
}

export interface CreateExpectationGroupReqQuery {}

/**
 * list expectation groups
 */
export interface ListExpectationGroupPathParam {}

export interface ListExpectationGroupReqBody {}

export interface ListExpectationGroupReqQuery {
  projectId: string;
}

/**
 * update expectation group
 */
export interface UpdateExpectationGroupPathParam {
  groupId: string;
}

export interface UpdateExpectationGroupReqBody {
  groupUpdate: Partial<ExpectationGroupM>;
  projectId: string;
}

export interface UpdateExpectationGroupReqQuery {}

/**
 * delete expectation group
 */
export interface DeleteExpectationGroupPathParam {
  groupId: string;
}

export interface DeleteExpectationGroupReqBody {}

export interface DeleteExpectationGroupReqQuery {
  projectId: string;
}
