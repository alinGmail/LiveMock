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
  // todo support code
  // CODE = "code",
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
  // 出现了
  SHOWED = "SHOWED",
  // 没出现
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
  | MatcherCondition.SHOWED
  | MatcherCondition.NOT_SHOWED
>;

export type ArrayMatcherCondition = Extract<
  MatcherCondition,
  | MatcherCondition.CONTAINS
  | MatcherCondition.NOT_CONTAINS
  | MatcherCondition.SHOWED
  | MatcherCondition.NOT_SHOWED
>;

export interface IMatcher {
  match: (req: express.Request) => boolean;
}

export function createHeaderMatcher(): HeaderMatcherM {
  return {
    id: uuId(),
    type: RequestMatcherType.HEADER,
    conditions: MatcherCondition.IS,
    value: "",
    name: "",
  };
}

export function createMethodMatcher(): MethodMatcherM {
  return {
    id: uuId(),
    type: RequestMatcherType.METHOD,
    conditions: MatcherCondition.IS,
    value: "",
  };
}

export function createParamMatcher(): ParamMatcherM {
  return {
    id: uuId(),
    type: RequestMatcherType.PARAM,
    conditions: MatcherCondition.IS,
    value: "",
    name: "",
  };
}
export function createPathMatcher(): PathMatcherM {
  return {
    conditions: MatcherCondition.IS,
    id: uuId(),
    type: RequestMatcherType.PATH,
    value: "",
  };
}
export function createQueryMatcher(): QueryMatcherM {
  return {
    conditions: MatcherCondition.IS,
    id: uuId(),
    name: "",
    type: RequestMatcherType.QUERY,
    value: "",
  };
}
export const matcherHasName = (matcher: RequestMatcherM) => {
  return [
    RequestMatcherType.HEADER,
    RequestMatcherType.PARAM,
    RequestMatcherType.QUERY,
  ].indexOf(matcher.type) !== -1;
};

export const matcherHasValue = (matcher: RequestMatcherM):boolean =>{
  return [
      MatcherCondition.SHOWED,
      MatcherCondition.NOT_SHOWED,
  ].indexOf(matcher.conditions) === -1;
}

export type RequestMatcherHasName = HeaderMatcherM | QueryMatcherM | ParamMatcherM;
