export interface ProjectM {
  id: string;
  name: string;
  description: string;
  port: string;
  createDate: string | Date;
  status: string;
  error: boolean;
  errorMessage: string | null;
  unclosedWebsocketRequestLogIds: Array<number>;
  maxRequestLogNumber: number;
}

export type MatcherCondition =
  | "IS"
  | "IS_NOT"
  | "CONTAINS"
  | "NOT_CONTAINS"
  | "START_WITH"
  | "END_WITH"
  | "MATCH_REGEX"
  | "NOT_MATCH_REGEX"
  | "SHOWED"
  | "NOT_SHOWED"
  | "MATCH_GLOB"
  | "NO_MATCH_GLOB";

export type MatcherType = "method" | "path" | "header" | "query" | "param";

export interface RequestMatcherM {
  id: string;
  type: MatcherType;
  conditions: MatcherCondition;
  name?: string;
  value: string;
}

export interface CustomResponseActionM {
  id: string;
  type: "CUSTOM_RESPONSE";
  status: number;
  responseContent: {
    type: "JSON" | "TEXT";
    value: string;
    headers: Array<[string, string]>;
    contentHandler?: "NONE" | "MOCK_JS" | null;
  };
}

export interface ProxyActionM {
  id: string;
  type: "PROXY";
  protocol: "http" | "https";
  host: string;
  handleCross: boolean;
  crossAllowCredentials: boolean;
  supportWebsocket: boolean;
  pathRewrite: Array<{ type: string; value: string }>;
  prefixRemove: string | null;
  headers: Array<[string, string]>;
  requestHeaders: Array<[string, string]>;
}

export interface StaticDirectoryActionM {
  id: string;
  type: "STATIC_DIRECTORY";
  folderPath: string;
  urlPrefix: string;
}

export type ActionM =
  | CustomResponseActionM
  | ProxyActionM
  | StaticDirectoryActionM;

export interface ExpectationM {
  id: string;
  name: string;
  description: string;
  delay: number;
  priority: number;
  activate: boolean;
  matchers: Array<RequestMatcherM>;
  actions: Array<ActionM>;
  createTime: string | Date;
  groupId?: string | null;
}

export interface ExpectationGroupM {
  id: string;
  name: string;
  activate: boolean;
  priority: number;
  createTime: string | Date;
}

export interface LogM {
  id: number;
  expectationId: string | null;
  proxyInfo: {
    isProxy: boolean;
    proxyHost: string | null;
    proxyPath: string | null;
  } | null;
  req: {
    method: string;
    path: string;
    headers: Record<string, string | null | undefined>;
    query: Record<string, unknown>;
    body: unknown;
    rawBody: string | null;
    requestTime: number;
    requestTimeStr: string;
  } | null;
  res: {
    status: number;
    statusMessage: string;
    headers: Record<string, string | null | undefined>;
    body: unknown;
    rawBody: string | null;
    duration: number;
    responseTime: number;
    responseTimeStr: string;
  } | null;
}
