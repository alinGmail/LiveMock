import express, { Request, Response } from "express";
import bodyParser from "body-parser";
import { addCross, ServerError, toAsyncRouter } from "./common";
import { requireAuth, AuthRequest } from "./authMiddleware";
import {
  clearSessionCookie,
  getSessionTokenFromCookie,
  setSessionCookie,
} from "../auth/cookies";
import {
  createAccountIfAbsent,
  createSession,
  deleteSession,
  deleteSessions,
  getAccount,
  recordLogin,
  updatePassword,
  validateCredentials,
  validatePassword,
  verifyPassword,
} from "../auth/authStore";
import { LoginThrottle } from "../auth/loginThrottle";

export function getAuthRouter(
  dbPath: string,
  throttle: LoginThrottle
): express.Router {
  const router = toAsyncRouter(express.Router());
  const auth = requireAuth(dbPath);

  router.options("*", (req, res) => {
    addCross(res);
    res.end();
  });

  router.use(bodyParser.json());

  /**
   * Public: does the single account exist yet?
   */
  router.get("/status", async (req: Request, res: Response) => {
    const account = await getAccount(dbPath);
    res.json({ accountExists: !!account });
  });

  /**
   * Public, one-shot: create the single account and log it in. Permanently
   * rejected once an account exists.
   */
  router.post("/register", async (req: Request, res: Response) => {
    const error = validateCredentials(req.body?.username, req.body?.password);
    if (error) {
      throw new ServerError(400, error);
    }
    const username = (req.body.username as string).trim();
    const user = await createAccountIfAbsent(
      dbPath,
      username,
      req.body.password
    );
    if (!user) {
      throw new ServerError(403, "registration is closed");
    }
    const { token, expiresAt } = await createSession(dbPath, username);
    setSessionCookie(res, token, expiresAt);
    res.json({ username: user.username });
  });

  /**
   * Public. One uniform error for every failure so the response never reveals
   * whether the username or the password was wrong.
   */
  router.post("/login", async (req: Request, res: Response) => {
    const ip = req.ip || req.socket.remoteAddress || "unknown";
    const throttleResult = throttle.check(ip);
    if (throttleResult.locked) {
      res.set("Retry-After", String(throttleResult.retryAfterSeconds));
      throw new ServerError(
        429,
        "too many failed login attempts, try again later"
      );
    }
    const username =
      typeof req.body?.username === "string"
        ? req.body.username.trim()
        : req.body?.username;
    const password = req.body?.password;
    const account = await getAccount(dbPath);
    const success =
      !!account &&
      typeof username === "string" &&
      typeof password === "string" &&
      account.username === username &&
      verifyPassword(password, account.passwordHash);
    if (!success) {
      throttle.recordFailure(ip);
      console.warn(`[auth] login failed for "${String(username)}"`);
      throw new ServerError(401, "invalid username or password");
    }
    throttle.recordSuccess(ip);
    await recordLogin(dbPath, account);
    const { token, expiresAt } = await createSession(dbPath, account.username);
    setSessionCookie(res, token, expiresAt);
    console.log(`[auth] login succeeded for "${account.username}"`);
    res.json({ username: account.username });
  });

  router.post("/logout", auth, async (req: Request, res: Response) => {
    const token = getSessionTokenFromCookie(req.headers.cookie);
    if (token) {
      await deleteSession(dbPath, token);
    }
    clearSessionCookie(res);
    res.json({ message: "success" });
  });

  router.get("/me", auth, (req: Request, res: Response) => {
    res.json({ username: (req as AuthRequest).username });
  });

  /**
   * Rotate the account password. The calling session stays valid, every other
   * session is revoked.
   */
  router.post("/changePassword", auth, async (req: Request, res: Response) => {
    const account = await getAccount(dbPath);
    if (!account) {
      throw new ServerError(401, "unauthorized");
    }
    const currentPassword = req.body?.currentPassword;
    if (
      typeof currentPassword !== "string" ||
      !verifyPassword(currentPassword, account.passwordHash)
    ) {
      throw new ServerError(403, "current password is incorrect");
    }
    const error = validatePassword(req.body?.newPassword);
    if (error) {
      throw new ServerError(400, error);
    }
    await updatePassword(dbPath, account, req.body.newPassword);
    await deleteSessions(
      dbPath,
      account.username,
      (req as AuthRequest).sessionTokenHash
    );
    res.json({ message: "success" });
  });

  return router;
}
