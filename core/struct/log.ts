import { v4 as uuId } from "uuid";

export interface LogM {
  id: number;
  req: RequestLogM | null;
  res: ResponseLogM | null;
  proxyInfo: ProxyInfoM | null;
  expectationId: string | null;
}

export interface ProxyInfoM {
  proxyToUrl: string | null;
  isProxy: boolean;
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

export function createLog(id:number): LogM {
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
    method: "get",
    path: "",
    rawBody: null,
    requestDate: new Date(),
  };
}

export function createResponseLog():ResponseLogM{
  const _now = new Date();
  return {
    body: undefined,
    duration: 0,
    headers: {},
    rawBody: "",
    responseDate: _now,
    status: 0,
    statusMessage: ""
  }
}

export enum FilterType {
  SIMPLE_FILTER = "SIMPLE_FILTER",
  GROUP_FILTER = "GROUP_FILTER",
}

interface SimpleFilterM {
  type: FilterType.SIMPLE_FILTER;
  id: string;
  property: string;
  value: string;
  condition: LogFilterCondition;
  activate: boolean;
}
interface GroupFilter {
    type: FilterType.GROUP_FILTER;
    id: string;
    conjunction: "AND" | "OR";
    subGroup: Array<SimpleFilterM>;
    activate: boolean;
}
export type LogFilterM =  SimpleFilterM |GroupFilter;

export enum LogFilterCondition{
    EQUAL="EQUAL",
    NOT_EQUAL="NOT_EQUAL",
    CONTAINS="CONTAINS",
    GREATER="GREATER",
    LESS="LESS"
}

export const LogFilterConditionMap:{
  [keys in LogFilterCondition]:string
} = {
  EQUAL:"$eq",
  NOT_EQUAL:"$neq",
  CONTAINS:"$contains",
  GREATER:"$gt",
  LESS:"$less"
}

function getKeyByValue<T extends Record<string, string>>(enumObject: T, value: string): keyof T | undefined {
  const entries = Object.entries(enumObject);
  const foundEntry = entries.find(([key, val]) => val === value);
  return foundEntry ? foundEntry[0] as keyof T : undefined;
}


export function createSimpleFilter():SimpleFilterM{
  return {
    activate: true,
    condition: LogFilterCondition.EQUAL,
    id: uuId(),
    property: "",
    type: FilterType.SIMPLE_FILTER,
    value: ""
  }
}

