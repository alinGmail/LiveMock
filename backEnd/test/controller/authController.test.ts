import express from "express";
import request from "supertest";
import { getApiRouter } from "../../src/apiRouter";
import { deleteFolderRecursive } from "../../src/common/utils";

const TEST_DB = "test_db_auth";

describe("auth controller", () => {
  let app: express.Express;

  beforeAll(async () => {
    deleteFolderRecursive(TEST_DB);
    app = express();
    app.use("/api", await getApiRouter(TEST_DB));
  });

  afterAll(() => {
    deleteFolderRecursive(TEST_DB);
  });

  test("registration validation rejects bad input before any account exists", async () => {
    let res = await request(app)
      .post("/api/auth/register")
      .send({ username: "", password: "password123" })
      .expect(400);
    expect(res.body.error.message).toBeTruthy();

    res = await request(app)
      .post("/api/auth/register")
      .send({ username: "admin", password: "short" })
      .expect(400);
    expect(res.body.error.message).toBeTruthy();
  });

  test("full account lifecycle through the composed api", async () => {
    // no account yet
    let res = await request(app).get("/api/auth/status").expect(200);
    expect(res.body).toEqual({ accountExists: false });

    // protected route refused without a session
    res = await request(app).get("/api/project/").expect(401);
    expect(res.body.error.message).toEqual("unauthorized");

    // register creates the account and logs in
    const agent = request.agent(app);
    res = await agent
      .post("/api/auth/register")
      .send({ username: "admin", password: "password123" })
      .expect(200);
    expect(res.body).toEqual({ username: "admin" });
    const setCookie = res.headers["set-cookie"][0];
    expect(setCookie).toContain("livemock_session=");
    expect(setCookie).toContain("HttpOnly");
    expect(setCookie).toContain("SameSite=Lax");
    expect(setCookie).toContain("Path=/");
    expect(setCookie).toContain("Max-Age=604800");

    // session identifies the account and opens protected routes
    res = await agent.get("/api/auth/me").expect(200);
    expect(res.body).toEqual({ username: "admin" });
    await agent.get("/api/project/").expect(200);

    // account now exists and registration is closed forever
    res = await request(app).get("/api/auth/status").expect(200);
    expect(res.body).toEqual({ accountExists: true });
    await request(app)
      .post("/api/auth/register")
      .send({ username: "intruder", password: "password123" })
      .expect(403);

    // logout ends only the current session
    await agent.post("/api/auth/logout").expect(200);
    await agent.get("/api/auth/me").expect(401);

    // uniform credential error, then a normal login
    res = await request(app)
      .post("/api/auth/login")
      .send({ username: "admin", password: "wrongpass" })
      .expect(401);
    expect(res.body.error.message).toEqual("invalid username or password");

    res = await request(app)
      .post("/api/auth/login")
      .send({ username: "unknown", password: "password123" })
      .expect(401);
    expect(res.body.error.message).toEqual("invalid username or password");

    const secondAgent = request.agent(app);
    res = await secondAgent
      .post("/api/auth/login")
      .send({ username: "admin", password: "password123" })
      .expect(200);
    expect(res.body).toEqual({ username: "admin" });
    await secondAgent.get("/api/auth/me").expect(200);

    // concurrent sessions coexist; logging out one leaves the other
    const thirdAgent = request.agent(app);
    await thirdAgent
      .post("/api/auth/login")
      .send({ username: "admin", password: "password123" })
      .expect(200);
    await secondAgent.post("/api/auth/logout").expect(200);
    await secondAgent.get("/api/auth/me").expect(401);
    await thirdAgent.get("/api/auth/me").expect(200);

    // usernames are trimmed before matching
    await request(app)
      .post("/api/auth/login")
      .send({ username: " admin ", password: "password123" })
      .expect(200);
  });

  test("a malformed session cookie is treated as unauthenticated", async () => {
    await request(app)
      .get("/api/auth/me")
      .set("Cookie", "livemock_session=%")
      .expect(401);
  });

  test("origin check rejects foreign state-changing requests only", async () => {
    // foreign origin is refused
    let res = await request(app)
      .post("/api/auth/login")
      .set("Origin", "http://evil.example")
      .send({ username: "admin", password: "password123" })
      .expect(403);
    expect(res.body.error.message).toBeTruthy();

    // matching origin passes the check (and fails credentials as expected)
    await request(app)
      .post("/api/auth/login")
      .set("Host", "livemock.example")
      .set("Origin", "http://livemock.example")
      .send({ username: "admin", password: "wrongpass" })
      .expect(401);

    // requests without an origin are allowed
    await request(app)
      .post("/api/auth/login")
      .send({ username: "admin", password: "wrongpass" })
      .expect(401);
  });
});
