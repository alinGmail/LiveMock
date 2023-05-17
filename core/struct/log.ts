import { v4 as uuId } from "uuid";

export interface LogM {
  id: string;
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

export function createLog(): LogM {
  return {
    id: uuId(),
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
