import { ExpectationGroupM } from "../expectationGroup";
import { EmptyResponse } from "./common";

export type CreateExpectationGroupResponse = ExpectationGroupM;

export type ListExpectationGroupResponse = Array<ExpectationGroupM>;

export type UpdateExpectationGroupResponse = ExpectationGroupM;

export type DeleteExpectationGroupResponse = EmptyResponse;
