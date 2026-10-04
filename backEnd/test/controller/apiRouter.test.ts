import express from "express";
import request from "supertest";
import { getApiRouter } from "../../src/apiRouter";
import { deleteFolderRecursive } from "../../src/common/utils";
import { createProject } from "livemock-core/struct/project";

describe("composed api router", () => {
  const testDb = "test_db_api_router";
  let app: express.Express;
  let agent: any;

  beforeAll(async () => {
    deleteFolderRecursive(testDb);
    app = express();
    app.use("/api", await getApiRouter(testDb));
    agent = request.agent(app);
    await agent
      .post("/api/auth/register")
      .send({ username: "admin", password: "password123" })
      .expect(200);
  });

  afterAll(() => {
    deleteFolderRecursive(testDb);
  });

  test("an existing route responds through the composed router", async () => {
    const res = await agent.get("/api/project/").expect(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  test("the error middleware keeps the existing error shape", async () => {
    const res = await agent
      .post("/api/project/")
      .send({ project: createProject() })
      .expect(400);
    expect(res.body.error.message).toEqual("project name can not be empty!");
  });
});
