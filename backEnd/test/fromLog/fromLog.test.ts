import {
  buildActionFromDraft,
  buildDraftFromLog,
  buildExpectationFromDraft,
  buildMatchersFromDraft,
  buildResponseContent,
  flattenForMatch,
  isValidJsonContent,
} from "livemock-core/import/fromLog";
import {
  MatcherCondition,
  RequestMatcherType,
} from "livemock-core/struct/matcher";
import { ActionType, ResponseType } from "livemock-core/struct/action";
import { LogM } from "livemock-core/struct/log";

function createMockLog(overrides: Partial<LogM> = {}): LogM {
  return {
    id: 1,
    expectationId: null,
    proxyInfo: null,
    websocketInfo: null,
    req: {
      body: null,
      rawBody: null,
      requestTime: 0,
      requestTimeStr: "",
      method: "GET",
      path: "/api/users",
      headers: {},
      query: {},
    },
    res: {
      headers: { "content-type": "application/json" },
      body: { ok: true },
      rawBody: '{"ok":true}',
      status: 200,
      statusMessage: "OK",
      duration: 0,
      responseTime: 0,
      responseTimeStr: "",
    },
    ...overrides,
  } as LogM;
}

describe("flattenForMatch", () => {
  test("flattens nested objects with dot paths", () => {
    expect(flattenForMatch({ user: { name: "lily", age: 18 } })).toEqual([
      { path: "user.name", value: "lily" },
      { path: "user.age", value: "18" },
    ]);
  });

  test("flattens arrays with indices", () => {
    expect(flattenForMatch({ items: [{ id: 1 }, { id: 2 }] })).toEqual([
      { path: "items.0.id", value: "1" },
      { path: "items.1.id", value: "2" },
    ]);
  });

  test("stringifies booleans and null leaves", () => {
    expect(flattenForMatch({ a: true, b: false, c: null })).toEqual([
      { path: "a", value: "true" },
      { path: "b", value: "false" },
      { path: "c", value: "" },
    ]);
  });

  test("drops undefined leaves", () => {
    expect(flattenForMatch({ a: "x", b: undefined })).toEqual([
      { path: "a", value: "x" },
    ]);
  });

  test("returns nothing for null input", () => {
    expect(flattenForMatch(null)).toEqual([]);
  });
});

describe("buildDraftFromLog", () => {
  test("selects method and path by default", () => {
    const draft = buildDraftFromLog(createMockLog());
    expect(draft.name).toBe("GET /api/users");
    expect(draft.method.checked).toBe(true);
    expect(draft.method.value).toBe("GET");
    expect(draft.path.checked).toBe(true);
    expect(draft.path.value).toBe("/api/users");
    expect(draft.method.condition).toBe(MatcherCondition.IS);
  });

  test("lists query and params but leaves them unchecked", () => {
    const draft = buildDraftFromLog(
      createMockLog({
        req: {
          body: { user: { name: "lily" }, age: 18 },
          rawBody: null,
          requestTime: 0,
          requestTimeStr: "",
          method: "POST",
          path: "/api/users",
          headers: {},
          query: { page: "1", tag: ["a", "b"] },
        },
      } as Partial<LogM>)
    );
    expect(draft.query).toEqual([
      { key: "query:page", name: "page", checked: false, condition: MatcherCondition.IS, value: "1" },
      { key: "query:tag.0", name: "tag.0", checked: false, condition: MatcherCondition.IS, value: "a" },
      { key: "query:tag.1", name: "tag.1", checked: false, condition: MatcherCondition.IS, value: "b" },
    ]);
    expect(draft.param).toEqual([
      { key: "param:user.name", name: "user.name", checked: false, condition: MatcherCondition.IS, value: "lily" },
      { key: "param:age", name: "age", checked: false, condition: MatcherCondition.IS, value: "18" },
    ]);
  });

  test("only checks content-type and filters system headers", () => {
    const draft = buildDraftFromLog(
      createMockLog({
        res: {
          headers: {
            "content-type": "application/json",
            "content-length": "12",
            "transfer-encoding": "chunked",
            connection: "keep-alive",
            "cache-control": "no-cache",
          },
          body: { ok: true },
          rawBody: '{"ok":true}',
          status: 201,
          statusMessage: "Created",
          duration: 0,
          responseTime: 0,
          responseTimeStr: "",
        },
      } as Partial<LogM>)
    );
    expect(draft.header.map((row) => row.name)).toEqual([
      "content-type",
      "cache-control",
    ]);
    expect(draft.header[0].checked).toBe(true);
    expect(draft.header[1].checked).toBe(false);
    expect(draft.status).toBe(201);
    expect(draft.content).toBe('{\n  "ok": true\n}');
  });

  test("falls back to an empty JSON object for non-JSON responses", () => {
    const draft = buildDraftFromLog(
      createMockLog({
        res: {
          headers: { "content-type": "text/plain" },
          body: "hello",
          rawBody: "hello",
          status: 200,
          statusMessage: "OK",
          duration: 0,
          responseTime: 0,
          responseTimeStr: "",
        },
      } as Partial<LogM>)
    );
    expect(draft.content).toBe("{}");
    expect(draft.header.length).toBe(1);
  });

  test("ignores a parsed body when the content type is not JSON", () => {
    const draft = buildDraftFromLog(
      createMockLog({
        res: {
          headers: { "content-type": "text/plain" },
          body: { a: 1 },
          rawBody: '{"a":1}',
          status: 200,
          statusMessage: "OK",
          duration: 0,
          responseTime: 0,
          responseTimeStr: "",
        },
      } as Partial<LogM>)
    );
    expect(draft.content).toBe("{}");
  });
});

describe("buildResponseContent", () => {
  test("pretty prints object bodies", () => {
    expect(
      buildResponseContent({
        headers: {},
        body: { a: 1 },
        rawBody: '{"a":1}',
        status: 200,
        statusMessage: "",
        duration: 0,
        responseTime: 0,
        responseTimeStr: "",
      })
    ).toBe('{\n  "a": 1\n}');
  });
});

describe("buildMatchersFromDraft", () => {
  test("creates method and path matchers when checked", () => {
    const matchers = buildMatchersFromDraft(buildDraftFromLog(createMockLog()));
    expect(matchers.length).toBe(2);
    expect(matchers[0].type).toBe(RequestMatcherType.METHOD);
    expect(matchers[0].value).toBe("GET");
    expect(matchers[1].type).toBe(RequestMatcherType.PATH);
    expect(matchers[1].value).toBe("/api/users");
  });

  test("only includes checked query/param rows", () => {
    const draft = buildDraftFromLog(
      createMockLog({
        req: {
          body: { age: 18 },
          rawBody: null,
          requestTime: 0,
          requestTimeStr: "",
          method: "POST",
          path: "/api/users",
          headers: {},
          query: { page: "1" },
        },
      } as Partial<LogM>)
    );
    draft.query[0].checked = true;
    const matchers = buildMatchersFromDraft(draft);
    const queryMatcher = matchers.find(
      (item) => item.type === RequestMatcherType.QUERY
    );
    expect(queryMatcher).toBeDefined();
    expect(queryMatcher?.name).toBe("page");
    expect(queryMatcher?.value).toBe("1");
    expect(
      matchers.find((item) => item.type === RequestMatcherType.PARAM)
    ).toBeUndefined();
  });
});

describe("buildExpectationFromDraft", () => {
  test("assembles a JSON custom response action", () => {
    const draft = buildDraftFromLog(createMockLog());
    const expectation = buildExpectationFromDraft(draft);
    expect(expectation.name).toBe("GET /api/users");
    expect(expectation.activate).toBe(true);
    expect(expectation.actions.length).toBe(1);
    const action = expectation.actions[0];
    if (action.type !== ActionType.CUSTOM_RESPONSE) {
      throw new Error("expected custom response action");
    }
    expect(action.status).toBe(200);
    expect(action.responseContent.type).toBe(ResponseType.JSON);
    expect(action.responseContent.value).toBe('{\n  "ok": true\n}');
    expect(action.responseContent.headers).toEqual([["content-type", "application/json"]]);
  });

  test("normalises empty content to {}", () => {
    const draft = buildDraftFromLog(createMockLog());
    draft.content = "   ";
    const action = buildActionFromDraft(draft);
    expect(action.responseContent.value).toBe("{}");
  });

  test("allows an empty matcher set", () => {
    const draft = buildDraftFromLog(createMockLog());
    draft.method.checked = false;
    draft.path.checked = false;
    expect(buildMatchersFromDraft(draft)).toEqual([]);
  });
});

describe("isValidJsonContent", () => {
  test("accepts empty and valid JSON", () => {
    expect(isValidJsonContent("")).toBe(true);
    expect(isValidJsonContent('{"a":1}')).toBe(true);
  });

  test("rejects invalid JSON", () => {
    expect(isValidJsonContent("{a:1}")).toBe(false);
  });
});
