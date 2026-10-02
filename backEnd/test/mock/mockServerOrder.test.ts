import express from "express";
import request from "supertest";
import { getProjectRouter } from "../../src/controller/projectController";
import { getGroupRouter } from "../../src/controller/expectationGroupController";
import { getExpectationRouter } from "../../src/controller/expectationController";
import { getLogRouter } from "../../src/controller/logController";
import { CustomErrorMiddleware } from "../../src/controller/common";
import getMockRouter from "../../src/server/mockServer";
import { createProject } from "livemock-core/struct/project";
import {
  createExpectation as buildExpectation,
  ExpectationM,
} from "livemock-core/struct/expectation";
import {
  createExpectationGroup,
  ExpectationGroupM,
} from "livemock-core/struct/expectationGroup";
import {
  createMethodMatcher,
  MatcherCondition,
} from "livemock-core/struct/matcher";
import {
  createCustomResponseAction,
  ResponseType,
} from "livemock-core/struct/action";
import { deleteFolderRecursive } from "../../src/common/utils";

const dbPath = "test_db_group_order";

describe("mock server match order with expectation groups", () => {
  const server = express();
  const projectM = createProject();
  projectM.name = "group order project";
  let projectId = "";

  beforeAll(async () => {
    server.use("/project", await getProjectRouter(dbPath));
    server.use("/group", getGroupRouter(dbPath));
    server.use("/expectation", getExpectationRouter(dbPath));
    server.use("/log", await getLogRouter(dbPath));
    server.use(CustomErrorMiddleware);

    const projectRes = await request(server)
      .post("/project/")
      .send({ project: projectM })
      .expect(200);
    projectId = projectRes.body.id;

    server.all("*", await getMockRouter(dbPath, projectId));
  });

  afterAll(() => {
    deleteFolderRecursive(dbPath);
  });

  async function cleanup() {
    const expectationsRes = await request(server)
      .get(`/expectation/?projectId=${projectId}`)
      .expect(200);
    for (const expectation of expectationsRes.body) {
      await request(server)
        .delete(`/expectation/${expectation.id}?projectId=${projectId}`)
        .expect(200);
    }
    const groupsRes = await request(server)
      .get(`/group/?projectId=${projectId}`)
      .expect(200);
    for (const group of groupsRes.body) {
      await request(server)
        .delete(`/group/${group.id}?projectId=${projectId}`)
        .expect(200);
    }
  }

  async function createGroup(
    name: string,
    priority: number,
    createTime: string,
    activate = true
  ): Promise<ExpectationGroupM> {
    const group = createExpectationGroup(name);
    group.priority = priority;
    group.createTime = new Date(createTime);
    group.activate = activate;
    const res = await request(server)
      .post("/group/")
      .send({ group, projectId })
      .expect(200);
    return res.body;
  }

  async function createRespondingExpectation(options: {
    groupId?: string | null;
    priority: number;
    createTime: string;
    body: string;
    activate?: boolean;
  }): Promise<ExpectationM> {
    const expectation = buildExpectation();
    expectation.name = options.body;
    expectation.groupId = options.groupId ? options.groupId : null;
    expectation.priority = options.priority;
    expectation.createTime = new Date(options.createTime);
    expectation.activate = options.activate === undefined ? true : options.activate;

    const methodMatcher = createMethodMatcher();
    methodMatcher.conditions = MatcherCondition.IS;
    methodMatcher.value = "GET";
    expectation.matchers = [methodMatcher];

    const action = createCustomResponseAction();
    action.responseContent.type = ResponseType.TEXT;
    action.responseContent.value = options.body;
    expectation.actions = [action];

    const res = await request(server)
      .post("/expectation/")
      .send({ expectation, projectId })
      .expect(200);
    return res.body;
  }

  beforeEach(async () => {
    await cleanup();
  });

  test("an active group block outranks a lower-priority ungrouped expectation", async () => {
    const group = await createGroup("high group", 100, "2026-01-01T00:00:00.000Z");
    await createRespondingExpectation({
      groupId: group.id,
      priority: 0,
      createTime: "2026-01-01T00:00:00.000Z",
      body: "group member",
    });
    await createRespondingExpectation({
      groupId: null,
      priority: 50,
      createTime: "2026-01-01T00:00:00.000Z",
      body: "ungrouped",
    });

    const res = await request(server).get("/anything").expect(200);
    expect(res.text).toEqual("group member");
  });

  test("a high-priority ungrouped expectation outranks a lower-priority group", async () => {
    const group = await createGroup("low group", 10, "2026-01-01T00:00:00.000Z");
    await createRespondingExpectation({
      groupId: group.id,
      priority: 999,
      createTime: "2026-01-01T00:00:00.000Z",
      body: "group member",
    });
    await createRespondingExpectation({
      groupId: null,
      priority: 100,
      createTime: "2026-01-01T00:00:00.000Z",
      body: "ungrouped",
    });

    const res = await request(server).get("/anything").expect(200);
    expect(res.text).toEqual("ungrouped");
  });

  test("a deactivated group does not participate in matching", async () => {
    const group = await createGroup(
      "off group",
      999,
      "2026-01-01T00:00:00.000Z",
      false
    );
    await createRespondingExpectation({
      groupId: group.id,
      priority: 0,
      createTime: "2026-01-01T00:00:00.000Z",
      body: "group member",
    });
    await createRespondingExpectation({
      groupId: null,
      priority: 1,
      createTime: "2026-01-01T00:00:00.000Z",
      body: "ungrouped",
    });

    const res = await request(server).get("/anything").expect(200);
    expect(res.text).toEqual("ungrouped");
  });

  test("an inactive member of an active group does not participate in matching", async () => {
    const group = await createGroup(
      "active group",
      100,
      "2026-01-01T00:00:00.000Z"
    );
    await createRespondingExpectation({
      groupId: group.id,
      priority: 0,
      createTime: "2026-01-01T00:00:00.000Z",
      body: "inactive member",
      activate: false,
    });
    await createRespondingExpectation({
      groupId: null,
      priority: 1,
      createTime: "2026-01-01T00:00:00.000Z",
      body: "ungrouped",
    });

    const res = await request(server).get("/anything").expect(200);
    expect(res.text).toEqual("ungrouped");
  });

  test("a later-created group wins a priority tie against an ungrouped expectation", async () => {
    const group = await createGroup("tie group", 5, "2026-01-02T00:00:00.000Z");
    await createRespondingExpectation({
      groupId: group.id,
      priority: 0,
      createTime: "2026-01-01T00:00:00.000Z",
      body: "group member",
    });
    await createRespondingExpectation({
      groupId: null,
      priority: 5,
      createTime: "2026-01-01T00:00:00.000Z",
      body: "older ungrouped",
    });

    const res = await request(server).get("/anything").expect(200);
    expect(res.text).toEqual("group member");
  });

  test("a later-created ungrouped expectation wins a priority tie against a group", async () => {
    const group = await createGroup(
      "older group",
      5,
      "2026-01-01T00:00:00.000Z"
    );
    await createRespondingExpectation({
      groupId: group.id,
      priority: 0,
      createTime: "2026-01-01T00:00:00.000Z",
      body: "group member",
    });
    await createRespondingExpectation({
      groupId: null,
      priority: 5,
      createTime: "2026-01-02T00:00:00.000Z",
      body: "newer ungrouped",
    });

    const res = await request(server).get("/anything").expect(200);
    expect(res.text).toEqual("newer ungrouped");
  });

  test("a later-created group wins a priority tie between groups, regardless of member priority", async () => {
    const older = await createGroup("older group", 5, "2026-01-01T00:00:00.000Z");
    const newer = await createGroup("newer group", 5, "2026-01-02T00:00:00.000Z");
    await createRespondingExpectation({
      groupId: older.id,
      priority: 99,
      createTime: "2026-01-01T00:00:00.000Z",
      body: "older group member",
    });
    await createRespondingExpectation({
      groupId: newer.id,
      priority: 0,
      createTime: "2026-01-01T00:00:00.000Z",
      body: "newer group member",
    });

    const res = await request(server).get("/anything").expect(200);
    expect(res.text).toEqual("newer group member");
  });

  test("members inside a group are ordered by member priority", async () => {
    const group = await createGroup("members group", 100, "2026-01-01T00:00:00.000Z");
    await createRespondingExpectation({
      groupId: group.id,
      priority: 1,
      createTime: "2026-01-01T00:00:00.000Z",
      body: "low member",
    });
    await createRespondingExpectation({
      groupId: group.id,
      priority: 5,
      createTime: "2026-01-01T00:00:00.000Z",
      body: "high member",
    });

    const res = await request(server).get("/anything").expect(200);
    expect(res.text).toEqual("high member");
  });

  test("a later-created member wins a priority tie inside a group", async () => {
    const group = await createGroup("member tie group", 100, "2026-01-01T00:00:00.000Z");
    await createRespondingExpectation({
      groupId: group.id,
      priority: 5,
      createTime: "2026-01-01T00:00:00.000Z",
      body: "older member",
    });
    await createRespondingExpectation({
      groupId: group.id,
      priority: 5,
      createTime: "2026-01-02T00:00:00.000Z",
      body: "newer member",
    });

    const res = await request(server).get("/anything").expect(200);
    expect(res.text).toEqual("newer member");
  });

  test("an expectation whose group is missing matches as ungrouped", async () => {
    await createRespondingExpectation({
      groupId: "missing-group-id",
      priority: 100,
      createTime: "2026-01-01T00:00:00.000Z",
      body: "dangling",
    });
    await createRespondingExpectation({
      groupId: null,
      priority: 1,
      createTime: "2026-01-01T00:00:00.000Z",
      body: "ungrouped",
    });

    const res = await request(server).get("/anything").expect(200);
    expect(res.text).toEqual("dangling");
  });

  test("deleting a group removes its expectations from matching and keeps their logs", async () => {
    const group = await createGroup("cascade group", 100, "2026-01-01T00:00:00.000Z");
    const member = await createRespondingExpectation({
      groupId: group.id,
      priority: 0,
      createTime: "2026-01-01T00:00:00.000Z",
      body: "group member",
    });
    await createRespondingExpectation({
      groupId: null,
      priority: 1,
      createTime: "2026-01-01T00:00:00.000Z",
      body: "fallback",
    });

    const served = await request(server).get("/cascade-check").expect(200);
    expect(served.text).toEqual("group member");

    const logsBefore = await request(server)
      .get(`/log/?projectId=${projectId}`)
      .expect(200);
    const memberLogIds = logsBefore.body
      .filter((log: { expectationId: string }) => log.expectationId === member.id)
      .map((log: { id: number }) => log.id);
    expect(memberLogIds.length).toBeGreaterThan(0);

    await request(server)
      .delete(`/group/${group.id}?projectId=${projectId}`)
      .expect(200);

    const fallbackRes = await request(server).get("/cascade-check").expect(200);
    expect(fallbackRes.text).toEqual("fallback");

    const logsAfter = await request(server)
      .get(`/log/?projectId=${projectId}`)
      .expect(200);
    const preservedIds = logsAfter.body
      .filter((log: { id: number }) => memberLogIds.includes(log.id))
      .map((log: { id: number }) => log.id);
    expect(preservedIds).toEqual(memberLogIds);
  });
});
