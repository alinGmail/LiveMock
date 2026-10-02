import { createCustomResponseAction, ResponseType } from "../struct/action";
import { createExpectation, ExpectationM } from "../struct/expectation";
import {
  createMethodMatcher,
  createPathMatcher,
  MatcherCondition,
} from "../struct/matcher";
import { convertOpenApiPath } from "./path";
import { sampleFromSchema } from "./sample";
import { ImportOptions, ParseSectionResult } from "./types";

const HTTP_METHODS = [
  "get",
  "put",
  "post",
  "delete",
  "options",
  "head",
  "patch",
  "trace",
];

interface PickedResponse {
  status: number;
  responseType: ResponseType;
  value: string;
}

/** 每个 operation 生成一条 expectation */
export function parseOpenApi(
  spec: any,
  options: ImportOptions = {}
): ParseSectionResult {
  const expectations: ParseSectionResult["expectations"] = [];
  const failures: ParseSectionResult["failures"] = [];
  const paths = spec.paths && typeof spec.paths === "object" ? spec.paths : {};
  const prefix = options.preserveServerPrefix ? getServerPathPrefix(spec) : "";
  Object.keys(paths).forEach((rawPath) => {
    const pathItem = paths[rawPath];
    if (!pathItem || typeof pathItem !== "object") {
      return;
    }
    HTTP_METHODS.forEach((method) => {
      const operation = pathItem[method];
      if (!operation || typeof operation !== "object") {
        return;
      }
      const source = `${method.toUpperCase()} ${rawPath}`;
      try {
        expectations.push({
          source,
          expectation: buildExpectation(
            method,
            rawPath,
            operation,
            spec,
            prefix
          ),
        });
      } catch (error) {
        failures.push({ source, reason: errorMessage(error) });
      }
    });
  });
  return { expectations, failures };
}

function buildExpectation(
  method: string,
  rawPath: string,
  operation: any,
  spec: any,
  prefix: string
): ExpectationM {
  const expectation = createExpectation();
  expectation.name = getOperationName(method, rawPath, operation);

  const methodMatcher = createMethodMatcher();
  methodMatcher.value = method.toUpperCase();

  let fullPath = `${prefix}${rawPath}`;
  if (fullPath.charAt(0) !== "/") {
    fullPath = `/${fullPath}`;
  }
  fullPath = fullPath.replace(/\/{2,}/g, "/");
  const converted = convertOpenApiPath(fullPath);

  const pathMatcher = createPathMatcher();
  pathMatcher.value = converted.value;
  pathMatcher.conditions = converted.isGlob
    ? MatcherCondition.MATCH_GLOB
    : MatcherCondition.IS;

  expectation.matchers = [methodMatcher, pathMatcher];

  const response = pickResponse(operation, spec);
  const action = createCustomResponseAction();
  action.status = response.status;
  action.responseContent.type = response.responseType;
  action.responseContent.value = response.value;
  expectation.actions = [action];

  return expectation;
}

function getOperationName(
  method: string,
  rawPath: string,
  operation: any
): string {
  if (typeof operation.summary === "string" && operation.summary.trim() !== "") {
    return operation.summary.trim();
  }
  if (
    typeof operation.operationId === "string" &&
    operation.operationId.trim() !== ""
  ) {
    return operation.operationId.trim();
  }
  return `${method.toUpperCase()} ${rawPath}`;
}

/** servers[0].url 的路径前缀,host 永远忽略 */
function getServerPathPrefix(spec: any): string {
  const server = Array.isArray(spec.servers) ? spec.servers[0] : undefined;
  const url = server && server.url;
  if (typeof url !== "string" || url === "" || url.indexOf("{") !== -1) {
    return "";
  }
  let pathname = url;
  try {
    pathname = new URL(url).pathname;
  } catch (error) {
    // 相对路径,如 "/v1"
  }
  pathname = pathname.replace(/\/+$/, "");
  if (pathname === "/") {
    return "";
  }
  return pathname;
}

function pickResponse(operation: any, spec: any): PickedResponse {
  const responses =
    operation.responses && typeof operation.responses === "object"
      ? operation.responses
      : {};
  const keys = Object.keys(responses);
  const successCodes = keys
    .filter((key) => /^2\d\d$/.test(key))
    .sort((a, b) => Number(a) - Number(b));

  let code: string | undefined;
  if (successCodes.length > 0) {
    if (successCodes.indexOf("200") !== -1) {
      code = "200";
    } else if (successCodes.indexOf("201") !== -1) {
      code = "201";
    } else {
      code = successCodes[0];
    }
  } else if (keys.indexOf("default") !== -1) {
    code = "default";
  } else if (keys.length > 0) {
    code = keys[0];
  }

  if (!code) {
    return { status: 200, responseType: ResponseType.JSON, value: "" };
  }
  const status = /^\d+$/.test(code) ? Number(code) : 200;
  const response = responses[code];
  const content =
    response && response.content && typeof response.content === "object"
      ? response.content
      : {};
  const mediaTypes = Object.keys(content);
  if (mediaTypes.length === 0) {
    return { status, responseType: ResponseType.JSON, value: "" };
  }
  const mediaType = pickMediaType(content, mediaTypes);
  const rawValue = pickMediaValue(content[mediaType] || {}, spec);

  if (mediaType.toLowerCase().indexOf("json") !== -1) {
    return {
      status,
      responseType: ResponseType.JSON,
      value: serialize(rawValue),
    };
  }
  return {
    status,
    responseType: ResponseType.TEXT,
    value: typeof rawValue === "string" ? rawValue : serialize(rawValue),
  };
}

function pickMediaType(content: any, mediaTypes: Array<string>): string {
  if (mediaTypes.indexOf("application/json") !== -1) {
    return "application/json";
  }
  const withExample = mediaTypes.find((type) => {
    const media = content[type];
    return (
      media &&
      (media.example !== undefined || media.examples || media.schema)
    );
  });
  return withExample || mediaTypes[0];
}

function pickMediaValue(media: any, spec: any): any {
  if (media.examples && typeof media.examples === "object") {
    const exampleKeys = Object.keys(media.examples);
    if (exampleKeys.length > 0) {
      const first = media.examples[exampleKeys[0]];
      if (first && typeof first === "object" && "value" in first) {
        return first.value;
      }
      return first;
    }
  }
  if (media.example !== undefined) {
    return media.example;
  }
  if (media.schema) {
    return sampleFromSchema(media.schema, spec);
  }
  return {};
}

function serialize(value: any): string {
  const result = JSON.stringify(value, null, 2);
  return result === undefined ? "" : result;
}

function errorMessage(error: any): string {
  if (error instanceof Error && error.message) {
    return error.message;
  }
  return String(error);
}
