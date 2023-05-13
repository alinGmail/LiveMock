import { ActionM } from "../action";

/**
 * create action
 */
export interface CreateActionPathParam {}

export interface CreateActionReqBody {
  projectId: string;
  expectationId: string;
  action: ActionM;
}

export interface CreateActionReqQuery {}

/**
 * update action
 */
export interface UpdateActionPathParam {}

export interface UpdateActionReqBody {
  projectId: string;
  expectationId: string;
  actionUpdate: Partial<ActionM>;
}

export interface UpdateActionReqQuery {}


/**
 * delete action
 */
export interface DeleteActionPathParam{
  actionId:string;
}

export interface DeleteActionReqBody{

}

export interface DeleteActionReqQuery{
  projectId:string;
  expectationId:string;
}
