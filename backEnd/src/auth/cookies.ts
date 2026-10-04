import { Response } from "express";

export const SESSION_COOKIE_NAME = "livemock_session";

export function parseCookies(header: string | undefined): Record<string, string> {
  const cookies: Record<string, string> = {};
  if (!header) {
    return cookies;
  }
  for (const part of header.split(";")) {
    const index = part.indexOf("=");
    if (index < 0) {
      continue;
    }
    const name = part.slice(0, index).trim();
    const value = part.slice(index + 1).trim();
    if (name) {
      try {
        cookies[name] = decodeURIComponent(value);
      } catch {
        cookies[name] = value;
      }
    }
  }
  return cookies;
}

export function getSessionTokenFromCookie(
  header: string | undefined
): string | null {
  return parseCookies(header)[SESSION_COOKIE_NAME] || null;
}

function cookieSecure(): boolean {
  return process.env.LIVEMOCK_COOKIE_SECURE === "true";
}

export function setSessionCookie(
  res: Response,
  token: string,
  expiresAt: number
): void {
  res.cookie(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    secure: cookieSecure(),
    maxAge: Math.max(0, expiresAt - Date.now()),
  });
}

export function clearSessionCookie(res: Response): void {
  res.clearCookie(SESSION_COOKIE_NAME, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    secure: cookieSecure(),
  });
}
