import { ExpectationM } from "../expectation";

export interface CreateExpectationResponse {}

export type ListExpectationResponse = Array<ExpectationM>;


export type UpdateExpectationResponse = {
    message:string;
};
