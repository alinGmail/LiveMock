import express from "express";
import request from "supertest";
import fs from "fs";
import path from "path";
import { createProject } from "livemock-core/struct/project";
import { getProjectRouter } from "../../src/controller/projectController";
import { getExpectationRouter } from "../../src/controller/expectationController";
import { CustomErrorMiddleware } from "../../src/controller/common";
import { deleteFolderRecursive } from "../../src/common/utils";
import type { BatchImportResult } from "livemock-core/import/types";

function readFixture(name: string): string {
  return fs.readFileSync(path.join(__dirname, "fixtures", name), "utf8");
}

describe("expectation batch import", () => {
  const server = express();
  let projectId = "";

  beforeAll(async () => {
    server.use("/project", await getProjectRouter("test_db_import"));
    server.use("/expectation", getExpectationRouter("test_db_import"));
    server.use(CustomErrorMiddleware);
    const project = createProject();
    project.name = "import test project";
    const res = await request(server)
      .post("/project/")
      .send({ project })
      .expect(200);
    projectId = res.body.id;
  });

  afterAll(() => {
    deleteFolderRecursive("test_db_import");
  });

  test("imports, skips and overwrites", async () => {
    const content = readFixture("postman-collection.json");

    const first = await request(server)
      .post("/expectation/batchImport")
      .send({ projectId, content, options: {} })
      .expect(200);
    const firstResult = first.body as BatchImportResult;
    expect(firstResult.format).toBe("postman");
    expect(firstResult.created).toBe(3);
    expect(firstResult.overwritten).toBe(0);
    expect(firstResult.skipped).toBe(0);
    expect(firstResult.failures).toHaveLength(1);

    const second = await request(server)
      .post("/expectation/batchImport")
      .send({ projectId, content, options: {} })
      .expect(200);
    const secondResult = second.body as BatchImportResult;
    expect(secondResult.created).toBe(0);
    expect(secondResult.overwritten).toBe(0);
    expect(secondResult.skipped).toBe(3);

    const third = await request(server)
      .post("/expectation/batchImport")
      .send({ projectId, content, options: { overwrite: true } })
      .expect(200);
    const thirdResult = third.body as BatchImportResult;
    expect(thirdResult.created).toBe(0);
    expect(thirdResult.overwritten).toBe(3);

    const list = await request(server)
      .get(`/expectation/?projectId=${projectId}`)
      .expect(200);
    expect(list.body).toHaveLength(3);
  });

  test("imports an openapi file too", async () => {
    const content = readFixture("petstore-oas3.json");
    const res = await request(server)
      .post("/expectation/batchImport")
      .send({ projectId, content, options: {} })
      .expect(200);
    const result = res.body as BatchImportResult;
    expect(result.format).toBe("openapi3");
    expect(result.created).toBe(3);
    expect(result.failures).toHaveLength(0);
  });

  test("rejects an unrecognized file", async () => {
    const res = await request(server)
      .post("/expectation/batchImport")
      .send({ projectId, content: "not a spec" })
      .expect(400);
    expect(res.body.error.message).toContain("无法识别");
  });

  test("requires project id and content", async () => {
    await request(server)
      .post("/expectation/batchImport")
      .send({ content: "{}" })
      .expect(400);
    await request(server)
      .post("/expectation/batchImport")
      .send({ projectId })
      .expect(400);
  });
});
