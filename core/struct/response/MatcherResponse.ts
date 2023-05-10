import { RequestMatcherM } from "../matcher";
import {EmptyResponse} from "./common";

export type CreateMatcherResponse = RequestMatcherM;

export type ListMatcherResponse = Array<RequestMatcherM>;


export interface DeleteMatcherResponse extends EmptyResponse{
}

export type UpdateMatcherResponse = RequestMatcherM;

export type GetMatcherResponse = RequestMatcherM;
