import express from "express";
import request from "supertest";
import { getApiRouter } from "../../src/apiRouter";
import { deleteFolderRecursive } from "../../src/common/utils";

const TEST_DB = "test_db_change_password";

describe("change password", () => {
  let app: express.Express;
  let agentA: any;
  let agentB: any;

  beforeAll(async () => {
    deleteFolderRecursive(TEST_DB);
    app = express();
    app.use("/api", await getApiRouter(TEST_DB));
    agentA = request.agent(app);
    await agentA
      .post("/api/auth/register")
      .send({ username: "admin", password: "password123" })
      .expect(200);
    agentB = request.agent(app);
    await agentB
      .post("/api/auth/login")
      .send({ username: "admin", password: "password123" })
      .expect(200);
  });

  afterAll(() => {
    deleteFolderRecursive(TEST_DB);
  });

  test("rejects a wrong current password without side effects", async () => {
    const res = await agentA
      .post("/api/auth/changePassword")
      .send({ currentPassword: "wrongpass", newPassword: "newpassword123" })
      .expect(403);
    expect(res.body.error.message).toBeTruthy();

    // old password still works, both sessions still valid
    await request(app)
      .post("/api/auth/login")
      .send({ username: "admin", password: "password123" })
      .expect(200);
    await agentB.get("/api/auth/me").expect(200);
  });

  test("enforces the password policy on the new password", async () => {
    await agentA
      .post("/api/auth/changePassword")
      .send({ currentPassword: "password123", newPassword: "short" })
      .expect(400);
  });

  test("changes the password, keeps the current session and revokes others", async () => {
    const res = await agentA
      .post("/api/auth/changePassword")
      .send({ currentPassword: "password123", newPassword: "newpassword123" })
      .expect(200);
    expect(res.body.message).toEqual("success");

    // the calling session survives, the other one is invalidated
    await agentA.get("/api/auth/me").expect(200);
    await agentB.get("/api/auth/me").expect(401);

    // old password no longer works, the new one does
    await request(app)
      .post("/api/auth/login")
      .send({ username: "admin", password: "password123" })
      .expect(401);
    const fresh = request.agent(app);
    await fresh
      .post("/api/auth/login")
      .send({ username: "admin", password: "newpassword123" })
      .expect(200);
  });
});
