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
    const logView = createLogView();
    const filter = createSimpleFilter();
    filter.condition = LogFilterCondition.EQUAL;
    filter.property = "req.path";
    filter.value = "/never";
    logView.filters.push(filter);
    logViewCollection.insert(logView);
  });

  afterAll(() => {
    deleteFolderRecursive(dbPath);
  });

  function query(params: Record<string, unknown>) {
    return supertest(server)
      .get("/log/query")
      .query({ projectId: projectM.id, ...params });
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

  test("rejects invalid filters", async () => {
    const badStatus = await query({ status: "6xx" }).expect(400);
    expect(badStatus.body.error.message).toMatch(/invalid status/);

    const badTime = await query({ since: "not-a-time" }).expect(400);
    expect(badTime.body.error.message).toMatch(/since/);

    const badLimit = await query({ limit: 0 }).expect(400);
    expect(badLimit.body.error.message).toMatch(/limit/);
  });
});
