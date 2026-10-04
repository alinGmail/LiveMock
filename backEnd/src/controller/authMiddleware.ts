import { NextFunction, Request, Response } from "express";
import { getSession, renewSession } from "../auth/authStore";
import {
  getSessionTokenFromCookie,
  setSessionCookie,
} from "../auth/cookies";

const SAFE_METHODS = ["GET", "HEAD", "OPTIONS"];

/** Request augmented by requireAuth with the authenticated account. */
export interface AuthRequest extends Request {
  username?: string;
  sessionToken?: string;
  sessionTokenHash?: string;
}

function unauthorized(res: Response) {
  res.status(401).json({ error: { message: "unauthorized" } });
}

/**
 * Require a valid session cookie on every request that is not an OPTIONS
 * preflight. Refreshes the sliding expiry (throttled) and exposes the
 * authenticated username and session token on the request.
 */
export function requireAuth(dbPath: string) {
  return async (req: Request, res: Response, next: NextFunction) => {
    if (req.method === "OPTIONS") {
      return next();
    }
    try {
      const token = getSessionTokenFromCookie(req.headers.cookie);
      if (!token) {
        return unauthorized(res);
      }
      const session = await getSession(dbPath, token);
      if (!session) {
        return unauthorized(res);
      }
      if (await renewSession(dbPath, session)) {
        setSessionCookie(res, token, session.expiresAt);
      }
      const authRequest = req as AuthRequest;
      authRequest.username = session.username;
      authRequest.sessionToken = token;
      authRequest.sessionTokenHash = session.tokenHash;
      next();
    } catch (err) {
      next(err);
    }
  };
}

/**
 * Reject state-changing /api requests whose Origin header does not match the
 * request host. Requests without an Origin header (non-browser clients) are
 * allowed; safe methods are always allowed.
 */
export function originCheck() {
  return (req: Request, res: Response, next: NextFunction) => {
    if (SAFE_METHODS.includes(req.method)) {
      return next();
    }
    const origin = req.headers.origin;
    if (!origin) {
      return next();
    }
    try {
      if (new URL(origin).host === req.headers.host) {
        return next();
      }
    } catch {
      // malformed origin: fall through to the rejection below
    }
    res.status(403).json({ error: { message: "invalid origin" } });
  };
}
