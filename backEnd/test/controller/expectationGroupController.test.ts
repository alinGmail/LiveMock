import express from "express";
import request from "supertest";
import { getProjectRouter } from "../../src/controller/projectController";
import { getGroupRouter } from "../../src/controller/expectationGroupController";
import { getExpectationRouter } from "../../src/controller/expectationController";
import { CustomErrorMiddleware } from "../../src/controller/common";
import { createProject } from "livemock-core/struct/project";
import { createExpectation } from "livemock-core/struct/expectation";
import { createExpectationGroup } from "livemock-core/struct/expectationGroup";
import {
  CreateExpectationGroupReqBody,
  UpdateExpectationGroupReqBody,
} from "livemock-core/struct/params/ExpectationGroupParams";
import { deleteFolderRecursive } from "../../src/common/utils";
import { getGroupDb } from "../../src/db/dbManager";
import * as fs from "fs";

describe("expectation group controller", () => {
  const server = express();
  const projectM = createProject();
  projectM.name = "group test project";
  let projectId = "";

  beforeAll(async () => {
    server.use("/project", await getProjectRouter("test_db_group"));
    server.use("/group", getGroupRouter("test_db_group"));
    server.use("/expectation", getExpectationRouter("test_db_group"));
    server.use(CustomErrorMiddleware);
    const res = await request(server)
      .post("/project/")
      .send({ project: projectM })
      .expect(200);
    projectId = res.body.id;
  });

  afterAll(() => {
    deleteFolderRecursive("test_db_group");
  });

  test("reject duplicate group name in the same project", async () => {
    const first = createExpectationGroup("payments");
    await request(server)
      .post("/group/")
      .send({ group: first, projectId })
      .expect(200);

    const duplicate = createExpectationGroup("payments");
    const duplicateRes = await request(server)
      .post("/group/")
      .send({ group: duplicate, projectId })
      .expect(400);
    expect(duplicateRes.body.error.message).toEqual("group name already exist!");
  });

  test("allow the same group name in another project", async () => {
    const anotherProject = createProject();
    anotherProject.name = "another group test project";
    const projectRes = await request(server)
      .post("/project/")
      .send({ project: anotherProject })
      .expect(200);

    const group = createExpectationGroup("payments");
    await request(server)
      .post("/group/")
      .send({ group, projectId: projectRes.body.id })
      .expect(200);
  });

  test("update group name, activate and priority", async () => {
    const group = createExpectationGroup("search");
    const createRes = await request(server)
      .post("/group/")
      .send({ group, projectId })
      .expect(200);

    const updateParam: UpdateExpectationGroupReqBody = {
      projectId,
      groupUpdate: { name: "search v2", activate: false, priority: 7 },
    };
    const updateRes = await request(server)
      .put(`/group/${createRes.body.id}`)
      .send(updateParam)
      .expect(200);
    expect(updateRes.body.name).toEqual("search v2");
    expect(updateRes.body.activate).toBe(false);
    expect(updateRes.body.priority).toBe(7);

    const listRes = await request(server)
      .get(`/group/?projectId=${projectId}`)
      .expect(200);
    const listed = listRes.body.find(
      (item: { id: string }) => item.id === createRes.body.id
    );
    expect(listed.name).toEqual("search v2");
    expect(listed.priority).toBe(7);
  });

  test("reject renaming a group onto an existing name", async () => {
    const taken = createExpectationGroup("taken-name");
    await request(server)
      .post("/group/")
      .send({ group: taken, projectId })
      .expect(200);

    const other = createExpectationGroup("other-name");
    const otherRes = await request(server)
      .post("/group/")
      .send({ group: other, projectId })
      .expect(200);

    const updateParam: UpdateExpectationGroupReqBody = {
      projectId,
      groupUpdate: { name: "taken-name" },
    };
    const updateRes = await request(server)
      .put(`/group/${otherRes.body.id}`)
      .send(updateParam)
      .expect(400);
    expect(updateRes.body.error.message).toEqual("group name already exist!");
  });

  test("delete group fails for an unknown group", async () => {
    const deleteRes = await request(server)
      .delete(`/group/not-a-group?projectId=${projectId}`)
      .expect(500);
    expect(deleteRes.body.error.message).toEqual("group not exist");
  });

  test("deleting a group deletes its expectations only", async () => {
    const group = createExpectationGroup("cascade");
    const groupRes = await request(server)
      .post("/group/")
      .send({ group, projectId })
      .expect(200);

    const member = createExpectation();
    member.name = "group member";
    member.groupId = groupRes.body.id;
    const memberRes = await request(server)
      .post("/expectation/")
      .send({ expectation: member, projectId })
      .expect(200);

    const ungrouped = createExpectation();
    ungrouped.name = "ungrouped expectation";
    const ungroupedRes = await request(server)
      .post("/expectation/")
      .send({ expectation: ungrouped, projectId })
      .expect(200);

    const deleteRes = await request(server)
      .delete(`/group/${groupRes.body.id}?projectId=${projectId}`)
      .expect(200);
    expect(deleteRes.body.message).toEqual("success");

    const groupsRes = await request(server)
      .get(`/group/?projectId=${projectId}`)
      .expect(200);
    expect(
      groupsRes.body.find(
        (item: { id: string }) => item.id === groupRes.body.id
      )
    ).toBeUndefined();

    const expectationsRes = await request(server)
      .get(`/expectation/?projectId=${projectId}`)
      .expect(200);
    expect(
      expectationsRes.body.find(
        (item: { id: string }) => item.id === memberRes.body.id
      )
    ).toBeUndefined();
    expect(
      expectationsRes.body.find(
        (item: { id: string }) => item.id === ungroupedRes.body.id
      )
    ).toBeDefined();
  });

  test("list expectations in match order", async () => {
    const orderProject = createProject();
    orderProject.name = "match order project";
    const projectRes = await request(server)
      .post("/project/")
      .send({ project: orderProject })
      .expect(200);
    const orderProjectId = projectRes.body.id;

    const createGroup = async (
      name: string,
      priority: number,
      createTime: string
    ) => {
      const group = createExpectationGroup(name);
      group.priority = priority;
      group.createTime = new Date(createTime);
      const res = await request(server)
        .post("/group/")
        .send({ group, projectId: orderProjectId })
        .expect(200);
      return res.body.id;
    };
    const createExpectationIn = async (
      name: string,
      groupId: string | null,
      priority: number,
      createTime: string,
      activate = true
    ) => {
      const expectation = createExpectation();
      expectation.name = name;
      expectation.groupId = groupId;
      expectation.priority = priority;
      expectation.createTime = new Date(createTime);
      expectation.activate = activate;
      const res = await request(server)
        .post("/expectation/")
        .send({ expectation, projectId: orderProjectId })
        .expect(200);
      return res.body.id;
    };

    const highGroupId = await createGroup(
      "high group",
      200,
      "2026-01-01T00:00:00.000Z"
    );
    const highMemberId = await createExpectationIn(
      "high member",
      highGroupId,
      0,
      "2026-01-01T00:00:00.000Z"
    );
    const topUngroupedId = await createExpectationIn(
      "top ungrouped",
      null,
      100,
      "2026-01-01T00:00:00.000Z"
    );
    const inactiveUngroupedId = await createExpectationIn(
      "inactive ungrouped",
      null,
      50,
      "2026-01-01T00:00:00.000Z",
      false
    );
    const lowGroupId = await createGroup(
      "low group",
      10,
      "2026-01-01T00:00:00.000Z"
    );
    const lowMemberId = await createExpectationIn(
      "low member",
      lowGroupId,
      0,
      "2026-01-01T00:00:00.000Z"
    );
    const tieGroupId = await createGroup(
      "tie group",
      5,
      "2026-01-02T00:00:00.000Z"
    );
    const tieMemberId = await createExpectationIn(
      "tie member",
      tieGroupId,
      0,
      "2026-01-01T00:00:00.000Z"
    );
    const tieUngroupedId = await createExpectationIn(
      "tie ungrouped",
      null,
      5,
      "2026-01-01T00:00:00.000Z"
    );

    const listRes = await request(server)
      .get(`/expectation/?projectId=${orderProjectId}`)
      .expect(200);
    const listedIds = listRes.body.map((item: { id: string }) => item.id);
    expect(listedIds).toEqual([
      highMemberId,
      topUngroupedId,
      inactiveUngroupedId,
      lowMemberId,
      tieMemberId,
      tieUngroupedId,
    ]);
  });

  test("deleting a project removes its group database", async () => {
    const removableProject = createProject();
    removableProject.name = "project with groups";
    const projectRes = await request(server)
      .post("/project/")
      .send({ project: removableProject })
      .expect(200);
    const removableProjectId = projectRes.body.id;

    const group = createExpectationGroup("disposable");
    await request(server)
      .post("/group/")
      .send({ group, projectId: removableProjectId })
      .expect(200);

    const groupDb = await getGroupDb(removableProjectId, "test_db_group");
    fs.mkdirSync("test_db_group", { recursive: true });
    await new Promise<void>((resolve) =>
      groupDb.saveDatabase(() => resolve())
    );
    const groupDbFile = `test_db_group/${removableProjectId}_group.db`;
    expect(fs.existsSync(groupDbFile)).toBe(true);

    await request(server)
      .delete(`/project/${removableProjectId}`)
      .expect(200);
    expect(fs.existsSync(groupDbFile)).toBe(false);
  });

  test("create and list groups", async () => {
    const group = createExpectationGroup("checkout");
    group.priority = 10;
    const createParam: CreateExpectationGroupReqBody = { group, projectId };

    const createRes = await request(server)
      .post("/group/")
      .send(createParam)
      .expect(200);
    expect(createRes.body.name).toEqual("checkout");
    expect(createRes.body.priority).toBe(10);
    expect(createRes.body.activate).toBe(true);

    const listRes = await request(server)
      .get(`/group/?projectId=${projectId}`)
      .expect(200);
    const listed = listRes.body.find(
      (item: { id: string }) => item.id === createRes.body.id
    );
    expect(listed).toBeDefined();
    expect(listed.name).toEqual("checkout");
  });
});
