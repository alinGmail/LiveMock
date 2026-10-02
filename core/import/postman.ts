import { createCustomResponseAction, ResponseType } from "../struct/action";
import { createExpectation, ExpectationM } from "../struct/expectation";
import {
  createMethodMatcher,
  createPathMatcher,
  MatcherCondition,
} from "../struct/matcher";
import { convertPostmanPath, ConvertedPath } from "./path";
import { ImportFailure, ImportedExpectation, ParseSectionResult } from "./types";

interface ParsedItem {
  expectation?: ExpectationM;
  failure?: string;
}

interface PickedPostmanResponse {
  status: number;
  responseType: ResponseType;
  value: string;
}

/** 每个 leaf item 生成一条 expectation,folders 展平 */
export function parsePostman(collection: any): ParseSectionResult {
  const variables = buildVariableMap(collection);
  const expectations: Array<ImportedExpectation> = [];
  const failures: Array<ImportFailure> = [];
  walkItems(collection.item, (item) => {
    const source = sourceName(item);
    if (item.disabled === true) {
      failures.push({ source, reason: "item 已被禁用" });
      return;
    }
    try {
      const parsed = parseItem(item, variables);
      if (parsed.failure) {
        failures.push({ source, reason: parsed.failure });
      } else if (parsed.expectation) {
        expectations.push({ source, expectation: parsed.expectation });
      }
    } catch (error) {
      failures.push({ source, reason: errorMessage(error) });
    }
  });
  return { expectations, failures };
}

function walkItems(items: any, onLeaf: (item: any) => void): void {
  if (!Array.isArray(items)) {
    return;
  }
  items.forEach((item) => {
    if (!item || typeof item !== "object") {
      return;
    }
    if (Array.isArray(item.item)) {
      walkItems(item.item, onLeaf);
      return;
    }
    onLeaf(item);
  });
}

function buildVariableMap(collection: any): Record<string, string> {
  const map: Record<string, string> = {};
  if (Array.isArray(collection.variable)) {
    collection.variable.forEach((variable: any) => {
      if (
        variable &&
        typeof variable.key === "string" &&
        variable.value !== undefined &&
        variable.value !== null
      ) {
        map[variable.key] = String(variable.value);
      }
    });
  }
  return map;
}

function parseItem(item: any, variables: Record<string, string>): ParsedItem {
  const request = normalizeRequest(item.request);
  if (!request) {
    return { failure: "缺少 request" };
  }
  const method =
    typeof request.method === "string" && request.method.trim() !== ""
      ? request.method.trim().toUpperCase()
      : "GET";
  const rawUrl = extractRawUrl(request.url);
  if (rawUrl === undefined) {
    return { failure: "请求缺少 URL" };
  }
  if (/^wss?:\/\//i.test(rawUrl)) {
    return { failure: "不支持 websocket 请求" };
  }
  if (/^grpcs?:\/\//i.test(rawUrl)) {
    return { failure: "不支持 gRPC 请求" };
  }
  const resolved = resolveVariables(rawUrl, variables);
  const path = toPath(resolved.value);
  if (path.indexOf("{{") !== -1) {
    return { failure: `路径中存在未解析的变量: ${path}` };
  }
  const converted = convertPostmanPath(path);
  return { expectation: buildExpectation(item, method, converted) };
}

function normalizeRequest(request: any): any {
  if (typeof request === "string") {
    return { method: "GET", url: request };
  }
  if (request && typeof request === "object") {
    return request;
  }
  return undefined;
}

function extractRawUrl(url: any): string | undefined {
  if (typeof url === "string") {
    return url;
  }
  if (!url || typeof url !== "object") {
    return undefined;
  }
  if (typeof url.raw === "string" && url.raw !== "") {
    return url.raw;
  }
  if (Array.isArray(url.path) && url.path.length > 0) {
    return (
      "/" + url.path.map((segment: any) => String(segment)).join("/")
    );
  }
  return undefined;
}

function resolveVariables(
  text: string,
  variables: Record<string, string>
): { value: string; unresolved: boolean } {
  let unresolved = false;
  const value = text.replace(/\{\{\s*([^}]+?)\s*\}\}/g, (match, key) => {
    if (variables[key] !== undefined) {
      return variables[key];
    }
    unresolved = true;
    return match;
  });
  return { value, unresolved };
}

/** 绝对 URL 取 pathname;相对 URL 去掉 host/端口部分;忽略 query 与 hash */
function toPath(rawUrl: string): string {
  let value = rawUrl.trim().split("?")[0].split("#")[0];
  if (/^\/\//.test(value)) {
    const index = value.indexOf("/", 2);
    value = index === -1 ? "/" : value.slice(index);
  } else if (/^[a-zA-Z][a-zA-Z0-9+.-]*:\/\//.test(value)) {
    if (value.indexOf("{{") === -1) {
      try {
        value = new URL(value).pathname;
      } catch (error) {
        value = value.replace(/^[a-zA-Z][a-zA-Z0-9+.-]*:\/\/[^/]*/, "");
      }
    } else {
      // 含未解析变量时不要走 URL 解析(会做百分号编码),只手工去掉 scheme 与 host
      value = value.replace(/^[a-zA-Z][a-zA-Z0-9+.-]*:\/\/[^/]*/, "");
    }
  } else if (/^\{\{[^}]+\}\}\//.test(value)) {
    // host 是未解析变量,但 host 本来就会被忽略,保留其后的 path
    value = value.slice(value.indexOf("/"));
  } else {
    const slashIndex = value.indexOf("/");
    if (slashIndex > 0) {
      const before = value.slice(0, slashIndex);
      if (/^[\w.-]+:\d+$/.test(before) || /^[\w-]+(\.[\w-]+)+$/.test(before)) {
        value = value.slice(slashIndex);
      }
    }
  }
  if (value === "") {
    value = "/";
  }
  if (value.charAt(0) !== "/") {
    value = `/${value}`;
  }
  return value;
}

function buildExpectation(
  item: any,
  method: string,
  converted: ConvertedPath
): ExpectationM {
  const expectation = createExpectation();
  expectation.name =
    typeof item.name === "string" && item.name.trim() !== ""
      ? item.name.trim()
      : `${method} ${converted.value}`;

  const methodMatcher = createMethodMatcher();
  methodMatcher.value = method;

  const pathMatcher = createPathMatcher();
  pathMatcher.value = converted.value;
  pathMatcher.conditions = converted.isGlob
    ? MatcherCondition.MATCH_GLOB
    : MatcherCondition.IS;

  expectation.matchers = [methodMatcher, pathMatcher];

  const response = pickResponse(item);
  const action = createCustomResponseAction();
  action.status = response.status;
  action.responseContent.type = response.responseType;
  action.responseContent.value = response.value;
  expectation.actions = [action];

  return expectation;
}

/** saved example 中第一个 2xx;没有则 200 + {} */
function pickResponse(item: any): PickedPostmanResponse {
  const responses = Array.isArray(item.response) ? item.response : [];
  const success = responses.filter(
    (response: any) =>
      response &&
      Number(response.code) >= 200 &&
      Number(response.code) < 300
  );
  const chosen = success[0];
  if (!chosen) {
    return { status: 200, responseType: ResponseType.JSON, value: "{}" };
  }
  const status = Number(chosen.code);
  const body = typeof chosen.body === "string" ? chosen.body : "";
  if (body.trim() === "") {
    return { status, responseType: ResponseType.JSON, value: "{}" };
  }
  if (isValidJson(body)) {
    return { status, responseType: ResponseType.JSON, value: body };
  }
  return { status, responseType: ResponseType.TEXT, value: body };
}

function isValidJson(body: string): boolean {
  const trimmed = body.trim();
  const first = trimmed.charAt(0);
  if (first !== "{" && first !== "[") {
    return false;
  }
  try {
    JSON.parse(trimmed);
    return true;
  } catch (error) {
    return false;
  }
}

function sourceName(item: any): string {
  if (typeof item.name === "string" && item.name.trim() !== "") {
    return item.name.trim();
  }
  return "未命名 item";
}

function errorMessage(error: any): string {
  if (error instanceof Error && error.message) {
    return error.message;
  }
  return String(error);
}
