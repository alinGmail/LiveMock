import { v4 as uuId } from "uuid";

export interface LogM {
  id: number;
  req: RequestLogM | null;
  res: ResponseLogM | null;
  proxyInfo: ProxyInfoM | null;
  expectationId: string | null;
}

export interface ProxyInfoM {
  proxyHost: string | null;
  proxyPath: string | null;
  requestHeaders: Array<{ name: string; value: string }> | null | undefined;
  responseHeaders: Array<{ name: string; value: string }> | null | undefined;
  isProxy: boolean;
}

export interface ParsedQs {
  [key: string]: string | undefined | null | string[] | ParsedQs | ParsedQs[];
}

export interface RequestLogM {
  body: any | null;
  rawBody: string | null;
  requestDate: Date;
  method: string;
  path: string;
  headers: {
    [key: string]: string | undefined | null;
  };
  query: ParsedQs;
}

type ResponseLogM = {
  headers: {
    [key: string]: string | undefined | null;
  };
  body: any | null;
  rawBody: string | null;
  status: number;
  statusMessage: string;
  duration: number;
  responseDate: Date;
};

export function createLog(id: number): LogM {
  return {
    id: id,
    expectationId: null,
    proxyInfo: null,
    req: null,
    res: null,
  };
}

export function createRequestLog(): RequestLogM {
  return {
    body: null,
    headers: {},
    query: {},
    method: "get",
    path: "",
    rawBody: null,
    requestDate: new Date(),
  };
}

export function createResponseLog(): ResponseLogM {
  const _now = new Date();
  return {
    body: undefined,
    duration: 0,
    headers: {},
    rawBody: "",
    responseDate: _now,
    status: 0,
    statusMessage: "",
  };
}

export enum FilterType {
  SIMPLE_FILTER = "SIMPLE_FILTER",
  GROUP_FILTER = "GROUP_FILTER",
  PRESET_FILTER = "PRESET_FILTER",
}

export enum PresetFilterName {
  EXPECTATION = "EXPECTATION",
  METHODS = "METHODS",
  STATUS_CODE = "STATUS_CODE",
}

export interface SimpleFilterM {
  type: FilterType.SIMPLE_FILTER;
  id: string;
  property: string;
  value: string;
  condition: LogFilterCondition;
  activate: boolean;
}

export interface PresetFilterM {
  type: FilterType.PRESET_FILTER;
  name: PresetFilterName;
  id: string;
  property: string;
  value: string | Array<string> | Array<number>;
  condition: LogFilterCondition;
  activate: boolean;
}

export interface GroupFilter {
  type: FilterType.GROUP_FILTER;
  id: string;
  conjunction: "AND" | "OR";
  subGroup: Array<SimpleFilterM>;
  activate: boolean;
}
export type LogFilterM = SimpleFilterM | GroupFilter | PresetFilterM;

export enum LogFilterCondition {
  EQUAL = "EQUAL",
  NOT_EQUAL = "NOT_EQUAL",
  CONTAINS = "CONTAINS",
  GREATER = "GREATER",
  LESS = "LESS",
  IN = "IN",
}

export const LogFilterConditionMap: {
  [keys in LogFilterCondition]: string;
} = {
  EQUAL: "$eq",
  NOT_EQUAL: "$neq",
  CONTAINS: "$contains",
  GREATER: "$gt",
  LESS: "$less",
  IN: "$in",
};

function getKeyByValue<T extends Record<string, string>>(
  enumObject: T,
  value: string
): keyof T | undefined {
  const entries = Object.entries(enumObject);
  const foundEntry = entries.find(([key, val]) => val === value);
  return foundEntry ? (foundEntry[0] as keyof T) : undefined;
}

export function createSimpleFilter(): SimpleFilterM {
  return {
    activate: true,
    condition: LogFilterCondition.EQUAL,
    id: uuId(),
    property: "",
    type: FilterType.SIMPLE_FILTER,
    value: "",
  };
}

export function createExpectationPresetFilterM(): PresetFilterM {
  return {
    activate: true,
    condition: LogFilterCondition.EQUAL,
    id: uuId(),
    property: "expectationId",
    type: FilterType.PRESET_FILTER,
    value: "",
    name: PresetFilterName.EXPECTATION,
  };
}

export function createMethodsPresetFilterM(): PresetFilterM {
  return {
    activate: true,
    name: PresetFilterName.METHODS,
    condition: LogFilterCondition.IN,
    id: uuId(),
    property: "req.method",
    type: FilterType.PRESET_FILTER,
    value: "",
  };
}

export function createStatusCodePresetFilterM(): PresetFilterM {
  return {
    activate: true,
    name: PresetFilterName.STATUS_CODE,
    condition: LogFilterCondition.IN,
    id: uuId(),
    property: "res.status",
    type: FilterType.PRESET_FILTER,
    value: "",
  };
}
