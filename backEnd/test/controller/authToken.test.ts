import express from "express";
import request from "supertest";
import { getApiRouter } from "../../src/apiRouter";
import { deleteFolderRecursive } from "../../src/common/utils";
import { getProjectDb } from "../../src/db/dbManager";
import {
  ApiTokenM,
  resetAccount,
} from "../../src/auth/authStore";

const TEST_DB = "test_db_api_token";

describe("api tokens", () => {
  let app: express.Express;
  let agent: any;

  beforeAll(async () => {
    deleteFolderRecursive(TEST_DB);
    app = express();
    app.use("/api", await getApiRouter(TEST_DB));
    agent = request.agent(app);
    await agent
      .post("/api/auth/register")
      .send({ username: "admin", password: "password123" })
      .expect(200);
  });

  afterAll(async () => {
    deleteFolderRecursive(TEST_DB);
  });

  async function createToken(
    name: string,
    expiresInDays?: number
  ): Promise<any> {
    const res = await agent
      .post("/api/auth/tokens")
      .send(expiresInDays === undefined ? { name } : { name, expiresInDays })
      .expect(200);
    return res.body;
  }

  test("a session creates a token and the list never exposes the secret", async () => {
    const created = await createToken("laptop");
    expect(created.token).toMatch(/^lmk_[0-9a-f]{64}$/);
    expect(created.name).toEqual("laptop");
    expect(created.prefix).toMatch(/^lmk_[0-9a-f]{8}$/);
    expect(created.expiresAt).toBeNull();
    expect(created.tokenHash).toBeUndefined();

    const res = await agent.get("/api/auth/tokens").expect(200);
    expect(Array.isArray(res.body)).toBe(true);
    const record = res.body.find((item: any) => item.id === created.id);
    expect(record.name).toEqual("laptop");
    expect(record.prefix).toEqual(created.prefix);
    expect(record.token).toBeUndefined();
    expect(record.tokenHash).toBeUndefined();
  });

  test("a bearer token reaches the data plane without a cookie", async () => {
    const created = await createToken("ci");
    await request(app)
      .get("/api/project/")
      .set("Authorization", `Bearer ${created.token}`)
      .expect(200);

    const me = await request(app)
      .get("/api/auth/me")
      .set("Authorization", `Bearer ${created.token}`)
      .expect(200);
    expect(me.body).toEqual({ username: "admin", authType: "token" });
  });

  test("a token cannot manage tokens or change the password", async () => {
    const created = await createToken("cursor");

    await request(app)
      .get("/api/auth/tokens")
      .set("Authorization", `Bearer ${created.token}`)
      .expect(403);

    await request(app)
      .post("/api/auth/tokens")
      .set("Authorization", `Bearer ${created.token}`)
      .send({ name: "forged" })
      .expect(403);

    await request(app)
      .delete(`/api/auth/tokens/${created.id}`)
      .set("Authorization", `Bearer ${created.token}`)
      .expect(403);

    await request(app)
      .post("/api/auth/changePassword")
      .set("Authorization", `Bearer ${created.token}`)
      .send({ currentPassword: "password123", newPassword: "newpassword123" })
      .expect(403);
  });

  test("a revoked token stops working immediately", async () => {
    const created = await createToken("retired");
    await agent.delete(`/api/auth/tokens/${created.id}`).expect(200);
    await request(app)
      .get("/api/project/")
      .set("Authorization", `Bearer ${created.token}`)
      .expect(401);
  });

  test("an expired token is rejected", async () => {
    const created = await createToken("expired");
    const db = await getProjectDb(TEST_DB);
    const collection = db.getCollection<ApiTokenM>("apiToken");
    const record = collection.findOne({ id: created.id }) as ApiTokenM;
    record.expiresAt = Date.now() - 1;
    collection.update(record);

    await request(app)
      .get("/api/project/")
      .set("Authorization", `Bearer ${created.token}`)
      .expect(401);
  });

  test("changing the password revokes every token", async () => {
    const created = await createToken("before-password-change");
    await agent
      .post("/api/auth/changePassword")
      .send({ currentPassword: "password123", newPassword: "newpassword123" })
      .expect(200);
    await request(app)
      .get("/api/project/")
      .set("Authorization", `Bearer ${created.token}`)
      .expect(401);
  });

  test("duplicate and invalid names are rejected", async () => {
    await createToken("duplicate-me");
    await agent
      .post("/api/auth/tokens")
      .send({ name: " duplicate-me " })
      .expect(400);
    await agent.post("/api/auth/tokens").send({ name: "   " }).expect(400);
    await agent
      .post("/api/auth/tokens")
      .send({ name: "bad-expiry", expiresInDays: 0 })
      .expect(400);
    await agent
      .post("/api/auth/tokens")
      .send({ name: "bad-expiry-2", expiresInDays: "7" })
      .expect(400);
  });

  test("a token with an expiry reports that expiry", async () => {
    const before = Date.now();
    const created = await createToken("short-lived", 7);
    expect(created.expiresAt).toBeGreaterThanOrEqual(
      before + 7 * 24 * 60 * 60 * 1000
    );
    expect(created.expiresAt).toBeLessThan(
      Date.now() + 7 * 24 * 60 * 60 * 1000 + 5000
    );
  });

  test("resetting the account revokes every token", async () => {
    const created = await createToken("before-reset");
    await resetAccount(TEST_DB, "admin", "password123");
    await request(app)
      .get("/api/project/")
      .set("Authorization", `Bearer ${created.token}`)
      .expect(401);
  });
});
