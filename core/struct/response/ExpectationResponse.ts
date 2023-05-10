import { ExpectationM } from "../expectation";

export type CreateExpectationResponse = ExpectationM;

export type ListExpectationResponse = Array<ExpectationM>;

export type ExpectationDetailResponse = ExpectationM;

export type UpdateExpectationResponse = {
  message: string;
};

export type DeleteExpectationResponse = UpdateExpectationResponse;
