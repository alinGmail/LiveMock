import {
  createMethodMatcher,
  createParamMatcher,
  createPathMatcher,
  createQueryMatcher,
  MatcherCondition,
  RequestMatcherM,
} from "../struct/matcher";
import {
  createCustomResponseAction,
  CustomResponseActionM,
  ResponseType,
} from "../struct/action";
import { createExpectation, ExpectationM } from "../struct/expectation";
import { LogM } from "../struct/log";

/**
 * A single flattened leaf of a request payload, always represented as a string.
 * Nested objects use dot paths (`user.name`), arrays use indices (`items.0.id`).
 */
export interface FlatEntry {
  path: string;
  value: string;
}

/**
 * One editable row in the "mock this request" dialog. `key` is stable for the
 * lifetime of the dialog so React can keep rows keyed without re-rendering the
 * whole list while the user edits.
 */
export interface DraftRow {
  key: string;
  name?: string;
  checked: boolean;
  condition: MatcherCondition;
  value: string;
}

/**
 * The whole local state of the "mock this request" dialog. It is intentionally
 * pure data (no functions) so it can be built and consumed by pure helpers that
 * are shared between the web and desktop flavours and unit tested.
 */
export interface LogExpectationDraft {
  name: string;
  method: DraftRow;
  path: DraftRow;
  query: Array<DraftRow>;
  param: Array<DraftRow>;
  status: number;
  content: string;
  header: Array<DraftRow>;
}

/**
 * Response headers that must not be replayed back to a client. They are derived
 * from the transport itself and copying them can break the mocked response.
 */
export const SYSTEM_RESPONSE_HEADERS = [
  "content-length",
  "transfer-encoding",
  "connection",
  "keep-alive",
  "upgrade",
  "proxy-connection",
];

function isPlainContainer(value: unknown): boolean {
  return value !== null && typeof value === "object";
}

function getHeaderValue(
  headers: { [key: string]: string | undefined | null } | undefined | null,
  name: string
): string | undefined {
  if (!headers) {
    return undefined;
  }
  const lower = name.toLowerCase();
  const key = Object.keys(headers).find(
    (item) => item.toLowerCase() === lower
  );
  if (key === undefined) {
    return undefined;
  }
  const value = headers[key];
  return value === null ? undefined : value;
}

/**
 * Turn any leaf value into the string used both in the UI inputs and in the
 * matcher `value`. `null` becomes an empty string, booleans become
 * "true"/"false" and numbers are stringified.
 */
export function stringifyMatchValue(value: unknown): string {
  if (value === null || value === undefined) {
    return "";
  }
  if (typeof value === "boolean") {
    return value ? "true" : "false";
  }
  if (typeof value === "object") {
    return JSON.stringify(value);
  }
  return String(value);
}

/**
 * Flatten a nested object/array into dot/index paths. `null` leaves are kept
 * (as empty strings), `undefined` leaves are dropped because they represent
 * absent fields.
 */
export function flattenForMatch(
  input: unknown,
  prefix = ""
): Array<FlatEntry> {
  const result: Array<FlatEntry> = [];
  if (input === null || input === undefined) {
    return result;
  }
  if (Array.isArray(input)) {
    input.forEach((item, index) => {
      const path = prefix === "" ? String(index) : `${prefix}.${index}`;
      if (isPlainContainer(item)) {
        result.push(...flattenForMatch(item, path));
      } else if (item !== undefined) {
        result.push({ path, value: stringifyMatchValue(item) });
      }
    });
    return result;
  }
  if (typeof input === "object") {
    const record = input as { [key: string]: unknown };
    Object.keys(record).forEach((key) => {
      const value = record[key];
      const path = prefix === "" ? key : `${prefix}.${key}`;
      if (isPlainContainer(value)) {
        result.push(...flattenForMatch(value, path));
      } else if (value !== undefined) {
        result.push({ path, value: stringifyMatchValue(value) });
      }
    });
    return result;
  }
  if (prefix !== "") {
    result.push({ path: prefix, value: stringifyMatchValue(input) });
  }
  return result;
}

function isJsonResponse(res: LogM["res"]): boolean {
  if (!res) {
    return false;
  }
  const contentType = getHeaderValue(res.headers, "content-type");
  if (contentType && contentType.toLowerCase().indexOf("json") !== -1) {
    return true;
  }
  return isPlainContainer(res.body);
}

/**
 * Build the pre-filled response body. JSON responses are pretty printed; any
 * non-JSON response falls back to an empty JSON object.
 */
export function buildResponseContent(res: LogM["res"]): string {
  if (!res || !isJsonResponse(res)) {
    return "{}";
  }
  const body = res.body;
  if (isPlainContainer(body)) {
    try {
      return JSON.stringify(body, null, 2);
    } catch (error) {
      return "{}";
    }
  }
  if (typeof body === "string") {
    try {
      return JSON.stringify(JSON.parse(body), null, 2);
    } catch (error) {
      return "{}";
    }
  }
  if (typeof body === "number" || typeof body === "boolean") {
    return JSON.stringify(body, null, 2);
  }
  return "{}";
}

function buildHeaderRows(res: LogM["res"]): Array<DraftRow> {
  const result: Array<DraftRow> = [];
  if (!res || !res.headers) {
    return result;
  }
  Object.keys(res.headers).forEach((name) => {
    const value = res.headers[name];
    if (value === undefined || value === null) {
      return;
    }
    const lower = name.toLowerCase();
    if (SYSTEM_RESPONSE_HEADERS.indexOf(lower) !== -1) {
      return;
    }
    result.push({
      key: `header:${lower}`,
      name,
      checked: lower === "content-type",
      condition: MatcherCondition.IS,
      value: String(value),
    });
  });
  return result;
}

/**
 * Build the initial dialog state from a captured request log. Method and path
 * are selected by default; query/params are listed but unselected so the user
 * can tighten the match deliberately.
 */
export function buildDraftFromLog(log: LogM): LogExpectationDraft {
  const req = log.req;
  const res = log.res;
  const method = req?.method ?? "";
  const path = req?.path ?? "";
  return {
    name: `${method} ${path}`.trim(),
    method: {
      key: "method",
      checked: true,
      condition: MatcherCondition.IS,
      value: method,
    },
    path: {
      key: "path",
      checked: true,
      condition: MatcherCondition.IS,
      value: path,
    },
    query: flattenForMatch(req?.query).map((entry) => ({
      key: `query:${entry.path}`,
      name: entry.path,
      checked: false,
      condition: MatcherCondition.IS,
      value: entry.value,
    })),
    param: flattenForMatch(req?.body).map((entry) => ({
      key: `param:${entry.path}`,
      name: entry.path,
      checked: false,
      condition: MatcherCondition.IS,
      value: entry.value,
    })),
    status: res?.status ?? 200,
    content: buildResponseContent(res),
    header: buildHeaderRows(res),
  };
}

function isCheckedRow(row: DraftRow): boolean {
  return row.checked;
}

/**
 * Turn the selected rows of a draft into matchers. Method/path use value-only
 * matchers; query/param are name+value matchers whose `name` is the flattened
 * dot path (the matcher engine resolves it with lodash `get`).
 */
export function buildMatchersFromDraft(
  draft: LogExpectationDraft
): Array<RequestMatcherM> {
  const matchers: Array<RequestMatcherM> = [];
  if (draft.method.checked) {
    const matcher = createMethodMatcher();
    matcher.value = draft.method.value;
    matcher.conditions = draft.method.condition;
    matchers.push(matcher);
  }
  if (draft.path.checked) {
    const matcher = createPathMatcher();
    matcher.value = draft.path.value;
    matcher.conditions = draft.path.condition;
    matchers.push(matcher);
  }
  draft.query.filter(isCheckedRow).forEach((row) => {
    const matcher = createQueryMatcher();
    matcher.name = row.name ?? "";
    matcher.value = row.value;
    matcher.conditions = row.condition;
    matchers.push(matcher);
  });
  draft.param.filter(isCheckedRow).forEach((row) => {
    const matcher = createParamMatcher();
    matcher.name = row.name ?? "";
    matcher.value = row.value;
    matcher.conditions = row.condition;
    matchers.push(matcher);
  });
  return matchers;
}

/**
 * Build the custom JSON response action from a draft. Selected response headers
 * are carried over as-is.
 */
export function buildActionFromDraft(
  draft: LogExpectationDraft
): CustomResponseActionM {
  const action = createCustomResponseAction();
  action.status = draft.status;
  action.responseContent.type = ResponseType.JSON;
  action.responseContent.value =
    draft.content.trim() === "" ? "{}" : draft.content;
  action.responseContent.headers = draft.header
    .filter(isCheckedRow)
    .map((row) => [row.name ?? "", row.value] as [string, string]);
  return action;
}

/**
 * Assemble the full expectation that gets created in a single request.
 */
export function buildExpectationFromDraft(
  draft: LogExpectationDraft
): ExpectationM {
  const expectation = createExpectation();
  expectation.name = draft.name;
  expectation.matchers = buildMatchersFromDraft(draft);
  expectation.actions = [buildActionFromDraft(draft)];
  return expectation;
}

/**
 * Empty content is valid (it is normalised to `{}` on save); anything else must
 * parse as JSON because the action is always saved as a JSON response.
 */
export function isValidJsonContent(content: string): boolean {
  if (content.trim() === "") {
    return true;
  }
  try {
    JSON.parse(content);
    return true;
  } catch (error) {
    return false;
  }
}
