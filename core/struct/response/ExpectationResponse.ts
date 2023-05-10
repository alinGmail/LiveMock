import { ExpectationM } from "../expectation";
import {EmptyResponse} from "./common";

export type CreateExpectationResponse = ExpectationM;

export type ListExpectationResponse = Array<ExpectationM>;

export type GetExpectationResponse = ExpectationM;

export type UpdateExpectationResponse = ExpectationM;

export type DeleteExpectationResponse = EmptyResponse;
