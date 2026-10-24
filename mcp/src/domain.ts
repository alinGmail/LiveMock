import { randomUUID } from "node:crypto";
import {
  ActionM,
  ExpectationGroupM,
  ExpectationM,
  LogM,
  MatcherCondition,
  ProjectM,
  RequestMatcherM,
} from "./types.js";

export function mockBaseUrl(baseUrl: string, port: string): string {
  const hostname = new URL(baseUrl).hostname;
  return `http://${hostname}:${port}`;
}

/** Drop LokiJS storage metadata before sending records to an AI client. */
export function stripInternal<T>(value: T): T {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return value;
  }
  const { $loki, meta, ...rest } = value as any;
  return rest as T;
}

export function presentProject(project: ProjectM, baseUrl: string) {
  return {
    ...stripInternal(project),
    mockBaseUrl: mockBaseUrl(baseUrl, project.port),
  };
}

export function normalizeMatcher(input: any): RequestMatcherM {
  const base = {
    id: input.id ?? randomUUID(),
    type: input.type,
    conditions: (input.conditions ?? "IS") as MatcherCondition,
  };
  if (input.type === "method" || input.type === "path") {
    return { ...base, value: input.value ?? "" };
  }
  return {
    ...base,
    name: input.name ?? "",
    value: input.value ?? "",
  };
}

function normalizeHeaders(value: any): Array<[string, string]> {
  if (!Array.isArray(value)) {
    return [];
  }
  return value
    .filter((item) => Array.isArray(item) && item.length >= 2)
    .map((item) => [String(item[0]), String(item[1])] as [string, string]);
}

export function normalizeAction(input: any): ActionM {
  const id = input.id ?? randomUUID();
  if (input.type === "PROXY") {
    return {
      id,
      type: "PROXY",
      protocol: input.protocol === "https" ? "https" : "http",
      host: input.host ?? "",
      handleCross: input.handleCross ?? false,
      crossAllowCredentials: input.crossAllowCredentials ?? false,
      supportWebsocket: input.supportWebsocket ?? true,
      pathRewrite: Array.isArray(input.pathRewrite) ? input.pathRewrite : [],
      prefixRemove: input.prefixRemove ?? null,
      headers: normalizeHeaders(input.headers),
      requestHeaders: normalizeHeaders(input.requestHeaders),
    };
  }
  if (input.type === "STATIC_DIRECTORY") {
    return {
      id,
      type: "STATIC_DIRECTORY",
      folderPath: input.folderPath ?? "",
      urlPrefix: input.urlPrefix ?? "",
    };
  }

  const responseContent = input.responseContent ?? {};
  return {
    id,
    type: "CUSTOM_RESPONSE",
    status: typeof input.status === "number" ? input.status : 200,
    responseContent: {
      type: responseContent.type === "TEXT" ? "TEXT" : "JSON",
      value:
        typeof responseContent.value === "string" ? responseContent.value : "",
      headers: normalizeHeaders(responseContent.headers),
      contentHandler:
        responseContent.contentHandler === "MOCK_JS" ? "MOCK_JS" : "NONE",
    },
  };
}

export function normalizeExpectation(input: any): ExpectationM {
  return {
    id: input.id ?? randomUUID(),
    name: input.name ?? "",
    description: input.description ?? "",
    delay: typeof input.delay === "number" ? input.delay : 0,
    priority: typeof input.priority === "number" ? input.priority : 0,
    activate: input.activate ?? true,
    matchers: Array.isArray(input.matchers)
      ? input.matchers.map(normalizeMatcher)
      : [],
    actions: Array.isArray(input.actions)
      ? input.actions.map(normalizeAction)
      : [],
    createTime: input.createTime ?? new Date().toISOString(),
    groupId: input.groupId ?? null,
  };
}

export function normalizeExpectationUpdate(input: any): Partial<ExpectationM> {
  const update: Partial<ExpectationM> = {};
  if (input.name !== undefined) {
    update.name = input.name;
  }
  if (input.description !== undefined) {
    update.description = input.description;
  }
  if (input.delay !== undefined) {
    update.delay = input.delay;
  }
  if (input.priority !== undefined) {
    update.priority = input.priority;
  }
  if (input.activate !== undefined) {
    update.activate = input.activate;
  }
  if (input.groupId !== undefined) {
    update.groupId = input.groupId;
  }
  // Updates are raw: replacing matchers or actions means sending complete
  // objects. Filling create-time defaults here would silently reset fields
  // the caller did not mention.
  if (input.matchers !== undefined) {
    update.matchers = input.matchers;
  }
  if (input.actions !== undefined) {
    update.actions = input.actions;
  }
  return update;
}

export function normalizeGroup(input: any): ExpectationGroupM {
  return {
    id: input.id ?? randomUUID(),
    name: input.name ?? "",
    activate: input.activate ?? true,
    priority: typeof input.priority === "number" ? input.priority : 0,
    createTime: new Date().toISOString(),
  };
}

export function normalizeGroupUpdate(input: any) {
  const update: Record<string, unknown> = {};
  if (input.name !== undefined) {
    update.name = input.name;
  }
  if (input.activate !== undefined) {
    update.activate = input.activate;
  }
  if (input.priority !== undefined) {
    update.priority = input.priority;
  }
  return update;
}

function preview(value: unknown, limit = 240): string {
  const text =
    typeof value === "string" ? value : JSON.stringify(value ?? null) ?? "";
  if (text.length <= limit) {
    return text;
  }
  return `${text.slice(0, limit)}…`;
}

function summarizeMatcher(matcher: RequestMatcherM): string {
  return [matcher.type, matcher.conditions, matcher.name, matcher.value]
    .filter((part) => part !== undefined && part !== "")
    .join(" ");
}

function summarizeAction(action: ActionM) {
  if (action.type === "CUSTOM_RESPONSE") {
    return {
      type: action.type,
      status: action.status,
      contentType: action.responseContent?.type,
      bodyPreview: preview(action.responseContent?.value),
    };
  }
  if (action.type === "PROXY") {
    return {
      type: action.type,
      protocol: action.protocol,
      host: action.host,
    };
  }
  return {
    type: action.type,
    folderPath: action.folderPath,
    urlPrefix: action.urlPrefix,
  };
}

export function summarizeExpectation(expectation: ExpectationM) {
  return {
    id: expectation.id,
    name: expectation.name,
    description: expectation.description,
    activate: expectation.activate,
    priority: expectation.priority,
    delay: expectation.delay,
    groupId: expectation.groupId ?? null,
    matchers: (expectation.matchers ?? []).map(summarizeMatcher),
    actions: (expectation.actions ?? []).map(summarizeAction),
  };
}

export function summarizeLog(log: LogM, includeBody: boolean) {
  const summary: Record<string, unknown> = {
    id: log.id,
    method: log.req?.method ?? null,
    path: log.req?.path ?? null,
    status: log.res?.status ?? null,
    statusMessage: log.res?.statusMessage ?? null,
    duration: log.res?.duration ?? null,
    expectationId: log.expectationId ?? null,
    requestTimeStr: log.req?.requestTimeStr ?? null,
    isProxy: log.proxyInfo?.isProxy ?? false,
  };
  if (includeBody) {
    summary.requestBody = log.req?.body ?? log.req?.rawBody ?? null;
    summary.responseBody = log.res?.body ?? log.res?.rawBody ?? null;
  }
  return summary;
}
