import express from "express";
import { v4 as uuId } from "uuid";

export type RequestMatcherM =
  | MethodMatcherM
  | PathMatcherM
  | HeaderMatcherM
  | QueryMatcherM
  | ParamMatcherM;

export enum RequestMatcherType {
  METHOD = "method",
  PATH = "path",
  HEADER = "header",
  QUERY = "query",
  PARAM = "param",
  CODE = "code",
}

export type MethodMatcherM = {
  id: string;
  type: RequestMatcherType.METHOD;
  conditions: MatcherCondition;
  value: string;
};
export type PathMatcherM = {
  id: string;
  type: RequestMatcherType.PATH;
  conditions: MatcherCondition;
  value: string;
};
export type HeaderMatcherM = {
  id: string;
  type: RequestMatcherType.HEADER;
  conditions: MatcherCondition;
  name: string;
  value: string;
};

export type QueryMatcherM = {
  id: string;
  type: RequestMatcherType.QUERY;
  conditions: MatcherCondition;
  name: string;
  value: string;
};

export type ParamMatcherM = {
  id: string;
  type: RequestMatcherType.PARAM;
  conditions: MatcherCondition;
  name: string;
  value: string;
};

export enum MatcherCondition {
  IS = "IS",
  IS_NOT = "IS_NOT",
  CONTAINS = "CONTAINS",
  NOT_CONTAINS = "NOT_CONTAINS",
  START_WITH = "START_WITH",
  END_WITH = "END_WITH",
  MATCH_REGEX = "MATCH_REGEX",
  NOT_MATCH_REGEX = "NOT_MATCH_REGEX",
  SHOWED = "SHOWED",
  NOT_SHOWED = "NOT_SHOWED",
}

export type StringMatcherCondition = Extract<
  MatcherCondition,
  | MatcherCondition.IS
  | MatcherCondition.IS_NOT
  | MatcherCondition.CONTAINS
  | MatcherCondition.NOT_CONTAINS
  | MatcherCondition.START_WITH
  | MatcherCondition.END_WITH
  | MatcherCondition.MATCH_REGEX
  | MatcherCondition.NOT_MATCH_REGEX
>;


export interface IMatcher {
  match: (req: express.Request) => boolean;
}

export function createHeaderMatcher():HeaderMatcherM{
  return {
    id: uuId(),
    type: RequestMatcherType.HEADER,
    conditions: MatcherCondition.IS,
    value: "",
    name:'',
  }
}