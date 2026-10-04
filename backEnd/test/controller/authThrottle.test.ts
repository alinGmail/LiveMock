import express from "express";
import request from "supertest";
import { getApiRouter } from "../../src/apiRouter";
import { deleteFolderRecursive } from "../../src/common/utils";
import { applyTrustProxy } from "../../src/auth/trustProxy";

async function makeApp(db: string, trustProxy: string) {
  deleteFolderRecursive(db);
  const app = express();
  applyTrustProxy(app, trustProxy);
  app.use("/api", await getApiRouter(db));
  return app;
}

function loginAttempt(
  app: express.Express,
  forwardedFor?: string,
  password = "wrongpass"
) {
  const req = request(app)
    .post("/api/auth/login")
    .send({ username: "admin", password });
  if (forwardedFor) {
    req.set("X-Forwarded-For", forwardedFor);
  }
  return req;
}

describe("login throttling and trusted proxy", () => {
  test("throttles by direct IP when forwarding headers are not trusted", async () => {
    const app = await makeApp("test_db_throttle_off", "");

    for (let i = 0; i < 5; i++) {
      await loginAttempt(app, `1.2.3.${i}`).expect(401);
    }

    // Different spoofed headers do not help: all count against the direct peer.
    const res = await loginAttempt(app, "9.9.9.9").expect(429);
    expect(Number(res.headers["retry-after"])).toBeGreaterThan(0);

    await loginAttempt(app, "8.8.8.8").expect(429);
    deleteFolderRecursive("test_db_throttle_off");
  });

  test("honors X-Forwarded-For from a trusted proxy", async () => {
    const app = await makeApp("test_db_throttle_trusted", "127.0.0.1");

    for (let i = 0; i < 5; i++) {
      await loginAttempt(app, "1.1.1.1").expect(401);
    }
    await loginAttempt(app, "1.1.1.1").expect(429);
    // another client IP behind the same proxy is unaffected
    await loginAttempt(app, "2.2.2.2").expect(401);
    deleteFolderRecursive("test_db_throttle_trusted");
  });

  test("ignores X-Forwarded-For when the direct peer is not trusted", async () => {
    const app = await makeApp("test_db_throttle_untrusted", "10.0.0.1");

    for (let i = 0; i < 5; i++) {
      await loginAttempt(app, `1.1.1.${i}`).expect(401);
    }
    await loginAttempt(app, "9.9.9.9").expect(429);
    deleteFolderRecursive("test_db_throttle_untrusted");
  });

  test("a successful login clears the failure count", async () => {
    const app = await makeApp("test_db_throttle_reset", "");
    await request(app)
      .post("/api/auth/register")
      .send({ username: "admin", password: "password123" })
      .expect(200);

    for (let i = 0; i < 3; i++) {
      await loginAttempt(app).expect(401);
    }
    await loginAttempt(app, undefined, "password123").expect(200);
    for (let i = 0; i < 5; i++) {
      await loginAttempt(app).expect(401);
    }
    deleteFolderRecursive("test_db_throttle_reset");
  });

  test("an invalid trusted proxy list fails fast", () => {
    expect(() =>
      applyTrustProxy(express(), "definitely-not-an-ip")
    ).toThrow(/LIVEMOCK_TRUST_PROXY/);
  });
});
