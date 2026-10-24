import express, { Request, Response } from "express";
import bodyParser from "body-parser";
import { ServerError, toAsyncRouter } from "./common";
import { requireAuth, requireSessionAuth, AuthRequest } from "./authMiddleware";
import {
  clearSessionCookie,
  getSessionTokenFromCookie,
  setSessionCookie,
} from "../auth/cookies";
import {
  createAccountIfAbsent,
  createApiToken,
  createSession,
  deleteSession,
  deleteSessions,
  findApiTokenByName,
  getAccount,
  listApiTokens,
  recordLogin,
  revokeApiToken,
  TOKEN_MAX_EXPIRY_DAYS,
  updatePassword,
  validateCredentials,
  validatePassword,
  validateTokenName,
  verifyPassword,
} from "../auth/authStore";
import { LoginThrottle } from "../auth/loginThrottle";

export function getAuthRouter(
  dbPath: string,
  throttle: LoginThrottle
): express.Router {
  const router = toAsyncRouter(express.Router());
  const auth = requireAuth(dbPath);
  const sessionAuth = requireSessionAuth(dbPath);

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
    const authRequest = req as AuthRequest;
    res.json({
      username: authRequest.username,
      authType: authRequest.authType,
    });
  });

  /**
   * API tokens for non-browser clients. Management stays behind a browser
   * session: a token may drive the data plane but may not mint or revoke
   * credentials.
   */
  router.get("/tokens", sessionAuth, async (req: Request, res: Response) => {
    res.json(await listApiTokens(dbPath));
  });

  router.post("/tokens", sessionAuth, async (req: Request, res: Response) => {
    const nameError = validateTokenName(req.body?.name);
    if (nameError) {
      throw new ServerError(400, nameError);
    }
    const name = (req.body.name as string).trim();
    if (await findApiTokenByName(dbPath, name)) {
      throw new ServerError(400, "token name already exists!");
    }

    let expiresInDays: number | null = null;
    const rawExpiry = req.body?.expiresInDays;
    if (rawExpiry !== undefined && rawExpiry !== null) {
      if (
        typeof rawExpiry !== "number" ||
        !Number.isInteger(rawExpiry) ||
        rawExpiry < 1 ||
        rawExpiry > TOKEN_MAX_EXPIRY_DAYS
      ) {
        throw new ServerError(
          400,
          `expiresInDays must be an integer between 1 and ${TOKEN_MAX_EXPIRY_DAYS}`
        );
      }
      expiresInDays = rawExpiry;
    }

    const { token, record } = await createApiToken(
      dbPath,
      name,
      expiresInDays
    );
    res.json({ token, ...record });
  });

  router.delete(
    "/tokens/:tokenId",
    sessionAuth,
    async (req: Request, res: Response) => {
      const removed = await revokeApiToken(dbPath, req.params.tokenId);
      if (!removed) {
        throw new ServerError(404, "token not exist");
      }
      res.json({ message: "success" });
    }
  );

  /**
   * Rotate the account password. The calling session stays valid, every other
   * session and every API token is revoked.
   */
  router.post("/changePassword", sessionAuth, async (req: Request, res: Response) => {
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
