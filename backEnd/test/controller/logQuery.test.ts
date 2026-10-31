import express from "express";
import supertest from "supertest";
import { createProject } from "livemock-core/struct/project";
import {
  createLog,
  createSimpleFilter,
  LogFilterCondition,
  LogM,
  SimpleFilterM,
} from "livemock-core/struct/log";
import { createLogView } from "livemock-core/struct/logView";
import { CustomErrorMiddleware } from "../../src/controller/common";
import { getLogRouter } from "../../src/controller/logController";
import { deleteFolderRecursive } from "../../src/common/utils";
import {
  getLogCollection,
  getLogViewCollection,
} from "../../src/db/dbManager";

describe("log query", () => {
  const server = express();
  const projectM = createProject();
  const dbPath = "test_db_log_query";
  const baseTime = Date.parse("2026-01-01T00:00:00.000Z");
  let savedLogView: ReturnType<typeof createLogView>;

  function makeLog(
    id: number,
    method: string,
    logPath: string,
    status: number,
    expectationId: string | null,
    requestTime: number,
    requestBody: unknown,
  ): LogM {
    const log = createLog(id);
    log.expectationId = expectationId;
    log.req = {
      body: requestBody,
      rawBody: JSON.stringify(requestBody),
      headers: { token: `token-${id}` },
      query: {},
      method,
      path: logPath,
      requestTime,
      requestTimeStr: new Date(requestTime).toISOString(),
    };
    log.res = {
      body: { id },
      rawBody: JSON.stringify({ id }),
      headers: { "content-type": "application/json" },
      status,
      statusMessage: "test",
      duration: 5,
      responseTime: requestTime + 5,
      responseTimeStr: new Date(requestTime + 5).toISOString(),
    };
    return log;
  }

  beforeAll(async () => {
    server.use("/log", await getLogRouter(dbPath));
    server.use(CustomErrorMiddleware);

    const logCollection = await getLogCollection(projectM.id, dbPath);
    logCollection.insert([
      makeLog(101, "GET", "/users", 200, "exp-1", baseTime, { request: 101 }),
      makeLog(102, "POST", "/users", 201, "exp-1", baseTime + 1000, {
        request: 102,
      }),
      makeLog(103, "GET", "/orders", 404, "exp-2", baseTime + 2000, {
        request: 103,
      }),
      makeLog(104, "GET", "/users/42", 500, null, baseTime + 3000, {
        request: 104,
      }),
      makeLog(105, "GET", "/health", 200, "exp-1", baseTime + 4000, {
        request: 105,
      }),
    ]);

    // A saved view filter that would hide every log. Ad-hoc queries must ignore
    // it (and must not modify it).
    const logViewCollection = await getLogViewCollection(projectM.id, dbPath);
    savedLogView = createLogView();
    const filter = createSimpleFilter();
    filter.condition = LogFilterCondition.EQUAL;
    filter.property = "req.path";
    filter.value = "/never";
    savedLogView.filters.push(filter);
    logViewCollection.insert(savedLogView);
  });

  afterAll(() => {
    deleteFolderRecursive(dbPath);
  });

  function query(params: Record<string, unknown>) {
    return supertest(server)
      .get("/log/query")
      .query({ projectId: projectM.id, ...params });
  }

  function queryByFilters(body: Record<string, unknown>) {
    return supertest(server)
      .post("/log/queryByFilters")
      .send({ projectId: projectM.id, ...body });
  }

  test("returns newest first, strips bodies and reports hasMore", async () => {
    const res = await query({}).expect(200);
    expect(res.body.hasMore).toBe(false);
    expect(res.body.logs.map((log: LogM) => log.id)).toEqual([
      105, 104, 103, 102, 101,
    ]);
    expect(res.body.logs[0].req.headers.token).toBe("token-105");
    expect(res.body.logs[0].req.body).toBeNull();
    expect(res.body.logs[0].req.rawBody).toBeNull();
    expect(res.body.logs[0].res.body).toBeNull();
    expect(res.body.logs[0].res.rawBody).toBeNull();
  });

  test("keeps bodies when includeBody is true", async () => {
    const res = await query({ includeBody: true }).expect(200);
    expect(res.body.logs[0].req.body).toEqual({ request: 105 });
    expect(res.body.logs[0].res.body).toEqual({ id: 105 });
  });

  test("filters by method case-insensitively and ORs repeated values", async () => {
    const lowercase = await query({ method: "get" }).expect(200);
    expect(lowercase.body.logs.map((log: LogM) => log.id)).toEqual([
      105, 104, 103, 101,
    ]);

    const multiple = await query({ method: ["GET", "POST"] }).expect(200);
    expect(multiple.body.logs.map((log: LogM) => log.id)).toEqual([
      105, 104, 103, 102, 101,
    ]);
  });

  test("filters by exact path and by path substring", async () => {
    const exact = await query({ path: "/users" }).expect(200);
    expect(exact.body.logs.map((log: LogM) => log.id)).toEqual([102, 101]);

    const multiple = await query({ path: ["/users", "/health"] }).expect(200);
    expect(multiple.body.logs.map((log: LogM) => log.id)).toEqual([
      105, 102, 101,
    ]);

    const contains = await query({ pathContains: "users" }).expect(200);
    expect(contains.body.logs.map((log: LogM) => log.id)).toEqual([
      104, 102, 101,
    ]);
  });

  test("filters by exact status codes and status families", async () => {
    const family = await query({ status: "2xx" }).expect(200);
    expect(family.body.logs.map((log: LogM) => log.id)).toEqual([
      105, 102, 101,
    ]);

    const mixed = await query({ status: ["4xx", 500] }).expect(200);
    expect(mixed.body.logs.map((log: LogM) => log.id)).toEqual([104, 103]);
  });

  test("filters by expectationId and request time", async () => {
    const byExpectation = await query({ expectationId: "exp-1" }).expect(200);
    expect(byExpectation.body.logs.map((log: LogM) => log.id)).toEqual([
      105, 102, 101,
    ]);

    const byTime = await query({
      since: baseTime + 1500,
      until: new Date(baseTime + 3500).toISOString(),
    }).expect(200);
    expect(byTime.body.logs.map((log: LogM) => log.id)).toEqual([104, 103]);
  });

  test("pages backwards with maxLogId and limit", async () => {
    const first = await query({ maxLogId: 105, limit: 2 }).expect(200);
    expect(first.body.logs.map((log: LogM) => log.id)).toEqual([104, 103]);
    expect(first.body.hasMore).toBe(true);

    const second = await query({ maxLogId: 103, limit: 2 }).expect(200);
    expect(second.body.logs.map((log: LogM) => log.id)).toEqual([102, 101]);
    expect(second.body.hasMore).toBe(false);
  });

  test("ignores saved log view filters and does not mutate logs or views", async () => {
    const res = await query({}).expect(200);
    expect(res.body.logs.length).toBe(5);

    const logCollection = await getLogCollection(projectM.id, dbPath);
    expect(logCollection.findOne({ id: 101 })!.req!.body).toEqual({
      request: 101,
    });

    const logViewCollection = await getLogViewCollection(projectM.id, dbPath);
    const logView = logViewCollection.findOne({});
    expect(logView!.filters.length).toBe(1);
    expect((logView!.filters[0] as SimpleFilterM).value).toBe("/never");
  });

  test("queries logs with a view-style filter", async () => {
    const res = await queryByFilters({
      filters: [{ property: "req.method", condition: "EQUAL", value: "GET" }],
    }).expect(200);
    expect(res.body.logs.map((log: LogM) => log.id)).toEqual([
      105, 104, 103, 101,
    ]);
    expect(res.body.hasMore).toBe(false);
    expect(res.body.logs[0].req.body).toBeNull();
  });

  test("ANDs view-style filters and reaches nested request properties", async () => {
    const res = await queryByFilters({
      filters: [
        { property: "req.method", condition: "EQUAL", value: "GET" },
        { property: "req.path", condition: "CONTAINS", value: "users" },
      ],
    }).expect(200);
    expect(res.body.logs.map((log: LogM) => log.id)).toEqual([104, 101]);
  });

  test("supports IN, FAMILY and request-time conditions", async () => {
    const inList = await queryByFilters({
      filters: [
        {
          property: "req.method",
          condition: "IN",
          value: ["GET", "POST"],
        },
      ],
    }).expect(200);
    expect(inList.body.logs.map((log: LogM) => log.id)).toEqual([
      105, 104, 103, 102, 101,
    ]);

    const families = await queryByFilters({
      filters: [
        {
          property: "res.status",
          condition: "FAMILY",
          value: ["4xx", "500"],
        },
      ],
    }).expect(200);
    expect(families.body.logs.map((log: LogM) => log.id)).toEqual([104, 103]);

    const byTime = await queryByFilters({
      filters: [
        {
          property: "req.requestTime",
          condition: "GREATER",
          value: baseTime + 1500,
        },
        {
          property: "req.requestTime",
          condition: "LESS",
          value: baseTime + 3500,
        },
      ],
    }).expect(200);
    expect(byTime.body.logs.map((log: LogM) => log.id)).toEqual([104, 103]);
  });

  test("supports NOT_EQUAL, header paths and ISO time bounds", async () => {
    const notEqual = await queryByFilters({
      filters: [
        { property: "res.status", condition: "NOT_EQUAL", value: 200 },
      ],
    }).expect(200);
    expect(notEqual.body.logs.map((log: LogM) => log.id)).toEqual([
      104, 103, 102,
    ]);

    const header = await queryByFilters({
      filters: [
        {
          property: "req.headers.token",
          condition: "CONTAINS",
          value: "token-104",
        },
      ],
    }).expect(200);
    expect(header.body.logs.map((log: LogM) => log.id)).toEqual([104]);

    const body = await queryByFilters({
      filters: [
        {
          property: "req.body.request",
          condition: "EQUAL",
          value: 105,
        },
      ],
    }).expect(200);
    expect(body.body.logs.map((log: LogM) => log.id)).toEqual([105]);

    const byTime = await queryByFilters({
      filters: [
        {
          property: "req.requestTime",
          condition: "GREATER",
          value: new Date(baseTime + 1500).toISOString(),
        },
        {
          property: "req.requestTime",
          condition: "LESS",
          value: new Date(baseTime + 3500).toISOString(),
        },
      ],
    }).expect(200);
    expect(byTime.body.logs.map((log: LogM) => log.id)).toEqual([104, 103]);
  });

  test("pages by maxLogId on the filter endpoint", async () => {
    const res = await queryByFilters({
      filters: [{ property: "req.method", condition: "EQUAL", value: "GET" }],
      maxLogId: 105,
      limit: 2,
    }).expect(200);
    expect(res.body.logs.map((log: LogM) => log.id)).toEqual([104, 103]);
    expect(res.body.hasMore).toBe(true);
  });

  test("skips inactive filters and accepts preset-shaped filters", async () => {
    const inactive = await queryByFilters({
      filters: [
        {
          property: "req.method",
          condition: "EQUAL",
          value: "POST",
          activate: false,
        },
      ],
    }).expect(200);
    expect(inactive.body.logs.length).toBe(5);

    const preset = await queryByFilters({
      filters: [
        {
          type: "PRESET_FILTER",
          name: "EXPECTATION",
          property: "expectationId",
          condition: "EQUAL",
          value: "exp-2",
        },
      ],
    }).expect(200);
    expect(preset.body.logs.map((log: LogM) => log.id)).toEqual([103]);
  });

  test("pages and includes bodies on request", async () => {
    const first = await queryByFilters({
      filters: [{ property: "req.method", condition: "EQUAL", value: "GET" }],
      limit: 2,
      includeBody: true,
    }).expect(200);
    expect(first.body.logs.map((log: LogM) => log.id)).toEqual([105, 104]);
    expect(first.body.hasMore).toBe(true);
    expect(first.body.logs[0].req.body).toEqual({ request: 105 });
  });

  test("rejects GROUP_FILTER and malformed filters", async () => {
    const group = await queryByFilters({
      filters: [
        {
          type: "GROUP_FILTER",
          conjunction: "OR",
          subGroup: [],
          activate: true,
        },
      ],
    }).expect(400);
    expect(group.body.error.message).toMatch(/GROUP_FILTER/);

    const notArray = await queryByFilters({ filters: "req.method" }).expect(
      400
    );
    expect(notArray.body.error.message).toMatch(/array/);

    const badProperty = await queryByFilters({
      filters: [{ property: "$or", condition: "EQUAL", value: "GET" }],
    }).expect(400);
    expect(badProperty.body.error.message).toMatch(/property/);

    const badCondition = await queryByFilters({
      filters: [{ property: "req.method", condition: "LIKE", value: "GET" }],
    }).expect(400);
    expect(badCondition.body.error.message).toMatch(/condition/);

    const badValue = await queryByFilters({
      filters: [
        { property: "req.method", condition: "EQUAL", value: { a: 1 } },
      ],
    }).expect(400);
    expect(badValue.body.error.message).toMatch(/value/);

    const tooMany = await queryByFilters({
      filters: Array.from({ length: 51 }, () => ({
        property: "req.method",
        condition: "EQUAL",
        value: "GET",
      })),
    }).expect(400);
    expect(tooMany.body.error.message).toMatch(/at most/);

    const inactiveInvalid = await queryByFilters({
      filters: [
        {
          property: "req.method",
          condition: "LIKE",
          value: "GET",
          activate: false,
        },
      ],
    }).expect(400);
    expect(inactiveInvalid.body.error.message).toMatch(/condition/);

    const malformedJson = await supertest(server)
      .post("/log/queryByFilters")
      .set("Content-Type", "application/json")
      .send("{not json")
      .expect(400);
    expect(malformedJson.body.error.message).toMatch(/JSON body/);
  });

  test("does not mutate the saved view or the stored logs", async () => {
    const res = await queryByFilters({
      filters: [{ property: "req.method", condition: "EQUAL", value: "POST" }],
    }).expect(200);
    expect(res.body.logs.map((log: LogM) => log.id)).toEqual([102]);

    const logCollection = await getLogCollection(projectM.id, dbPath);
    expect(logCollection.findOne({ id: 101 })!.req!.body).toEqual({
      request: 101,
    });

    const logViewCollection = await getLogViewCollection(projectM.id, dbPath);
    const logView = logViewCollection.findOne({});
    expect(logView!.filters.length).toBe(1);
    expect((logView!.filters[0] as SimpleFilterM).value).toBe("/never");
    expect(logCollection.getDynamicView(savedLogView.id)).toBeNull();
  });

  test("rejects invalid filters", async () => {
    const badStatus = await query({ status: "6xx" }).expect(400);
    expect(badStatus.body.error.message).toMatch(/invalid status/);

    const badTime = await query({ since: "not-a-time" }).expect(400);
    expect(badTime.body.error.message).toMatch(/since/);

    const badLimit = await query({ limit: 0 }).expect(400);
    expect(badLimit.body.error.message).toMatch(/limit/);
  });
});
