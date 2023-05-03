import { ExpectationM } from "../expectation";

export interface CreateExpectationResponse {}

export type ListExpectationResponse = Array<ExpectationM>;

export type ExpectationDetailResponse = ExpectationM;

export type UpdateExpectationResponse = {
    message:string;
};

export type DeleteExpectationResponse = UpdateExpectationResponse;