import express from "express";
import request from "supertest";
import { getApiRouter } from "../../src/apiRouter";
import { deleteFolderRecursive } from "../../src/common/utils";
import { resetAdmin } from "../../src/script/resetAdmin";

const TEST_DB = "test_db_reset_admin";

describe("reset-admin", () => {
  let app: express.Express;
  let sessionAgent: any;

  beforeAll(async () => {
    deleteFolderRecursive(TEST_DB);
    app = express();
    app.use("/api", await getApiRouter(TEST_DB));
    sessionAgent = request.agent(app);
    await sessionAgent
      .post("/api/auth/register")
      .send({ username: "admin", password: "password123" })
      .expect(200);
  });

  afterAll(() => {
    deleteFolderRecursive(TEST_DB);
  });

  test("replaces the account and invalidates every session", async () => {
    await resetAdmin(TEST_DB, "newadmin", "newpassword123");

    // the previously issued session no longer works
    await sessionAgent.get("/api/auth/me").expect(401);

    // old credentials are gone, new credentials work
    await request(app)
      .post("/api/auth/login")
      .send({ username: "admin", password: "password123" })
      .expect(401);
    const res = await request(app)
      .post("/api/auth/login")
      .send({ username: "newadmin", password: "newpassword123" })
      .expect(200);
    expect(res.body).toEqual({ username: "newadmin" });
  });

  test("rejects invalid credentials", async () => {
    await expect(resetAdmin(TEST_DB, "", "newpassword123")).rejects.toThrow();
    await expect(resetAdmin(TEST_DB, "someone", "short")).rejects.toThrow();
  });
});
