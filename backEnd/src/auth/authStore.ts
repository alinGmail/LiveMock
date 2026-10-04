import { createHash, randomBytes, randomUUID } from "crypto";
import { compareSync, hashSync } from "bcryptjs";
import { getProjectDb } from "../db/dbManager";

export interface UserM {
  id: string;
  username: string;
  passwordHash: string;
  createTime: number;
  lastLoginAt: number | null;
}

export interface SessionM {
  tokenHash: string;
  username: string;
  createTime: number;
  updateTime: number;
  expiresAt: number;
}

export const SESSION_DURATION_MS = 7 * 24 * 60 * 60 * 1000;
export const SESSION_RENEW_THROTTLE_MS = 60 * 1000;
export const PASSWORD_MIN_LENGTH = 8;
export const PASSWORD_MAX_LENGTH = 64;
export const USERNAME_MAX_LENGTH = 64;
const BCRYPT_ROUNDS = 10;

async function getOrCreateCollection<T extends object>(
  path: string,
  name: string
) {
  const db = await getProjectDb(path);
  let entries = db.getCollection<T>(name);
  if (entries === null) {
    entries = db.addCollection<T>(name);
  }
  return entries;
}

function getUserCollection(path: string) {
  return getOrCreateCollection<UserM>(path, "user");
}

function getSessionCollection(path: string) {
  return getOrCreateCollection<SessionM>(path, "session");
}

export function validatePassword(password: unknown): string | null {
  if (
    typeof password !== "string" ||
    password.length < PASSWORD_MIN_LENGTH ||
    password.length > PASSWORD_MAX_LENGTH
  ) {
    return `password must be between ${PASSWORD_MIN_LENGTH} and ${PASSWORD_MAX_LENGTH} characters!`;
  }
  return null;
}

/**
 * Validate the registration/change-password inputs. Returns an error message
 * or null when the input is acceptable. Usernames are trimmed, passwords are
 * never trimmed.
 */
export function validateCredentials(
  username: unknown,
  password: unknown
): string | null {
  if (typeof username !== "string" || username.trim().length === 0) {
    return "username can not be empty!";
  }
  if (username.trim().length > USERNAME_MAX_LENGTH) {
    return `username can not be longer than ${USERNAME_MAX_LENGTH} characters!`;
  }
  return validatePassword(password);
}

export async function getAccount(path: string): Promise<UserM | null> {
  return (await getUserCollection(path)).findOne({});
}

export async function createAccount(
  path: string,
  username: string,
  password: string
): Promise<UserM> {
  const collection = await getUserCollection(path);
  const user: UserM = {
    id: randomUUID(),
    username,
    passwordHash: hashSync(password, BCRYPT_ROUNDS),
    createTime: Date.now(),
    lastLoginAt: null,
  };
  collection.insert(user);
  return user;
}

/**
 * Atomically create the single account: returns null when an account already
 * exists, so concurrent first registrations cannot both succeed.
 */
export async function createAccountIfAbsent(
  path: string,
  username: string,
  password: string
): Promise<UserM | null> {
  const collection = await getUserCollection(path);
  if (collection.findOne({})) {
    return null;
  }
  const user: UserM = {
    id: randomUUID(),
    username,
    passwordHash: hashSync(password, BCRYPT_ROUNDS),
    createTime: Date.now(),
    lastLoginAt: null,
  };
  collection.insert(user);
  return user;
}

export function verifyPassword(password: string, passwordHash: string): boolean {
  return compareSync(password, passwordHash);
}

export async function recordLogin(path: string, user: UserM): Promise<void> {
  const collection = await getUserCollection(path);
  user.lastLoginAt = Date.now();
  collection.update(user);
}

export async function updatePassword(
  path: string,
  user: UserM,
  password: string
): Promise<void> {
  const collection = await getUserCollection(path);
  user.passwordHash = hashSync(password, BCRYPT_ROUNDS);
  collection.update(user);
}

/** Replace the single account's username and password hash, then drop all sessions. */
export async function resetAccount(
  path: string,
  username: string,
  password: string
): Promise<UserM> {
  const collection = await getUserCollection(path);
  const existing = collection.findOne({});
  let user: UserM;
  if (existing) {
    existing.username = username;
    existing.passwordHash = hashSync(password, BCRYPT_ROUNDS);
    collection.update(existing);
    user = existing;
  } else {
    user = await createAccount(path, username, password);
  }
  await deleteSessions(path);
  return user;
}

export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export async function createSession(
  path: string,
  username: string
): Promise<{ token: string; expiresAt: number }> {
  const collection = await getSessionCollection(path);
  const now = Date.now();
  const token = randomBytes(32).toString("hex");
  const session: SessionM = {
    tokenHash: hashToken(token),
    username,
    createTime: now,
    updateTime: now,
    expiresAt: now + SESSION_DURATION_MS,
  };
  collection.insert(session);
  return { token, expiresAt: session.expiresAt };
}

export async function getSession(
  path: string,
  token: string
): Promise<SessionM | null> {
  const collection = await getSessionCollection(path);
  const session = collection.findOne({ tokenHash: hashToken(token) });
  if (!session) {
    return null;
  }
  if (session.expiresAt <= Date.now()) {
    collection.remove(session);
    return null;
  }
  return session;
}

/** Extend a session on activity; returns true when the expiry was renewed. */
export async function renewSession(
  path: string,
  session: SessionM
): Promise<boolean> {
  const now = Date.now();
  if (now - session.updateTime < SESSION_RENEW_THROTTLE_MS) {
    return false;
  }
  const collection = await getSessionCollection(path);
  session.updateTime = now;
  session.expiresAt = now + SESSION_DURATION_MS;
  collection.update(session);
  return true;
}

export async function deleteSession(path: string, token: string): Promise<void> {
  const collection = await getSessionCollection(path);
  collection.findAndRemove({ tokenHash: hashToken(token) });
}

export async function deleteSessions(
  path: string,
  username?: string,
  exceptTokenHash?: string
): Promise<void> {
  const collection = await getSessionCollection(path);
  const sessions = collection.find(username ? { username } : {});
  for (const session of sessions) {
    if (exceptTokenHash && session.tokenHash === exceptTokenHash) {
      continue;
    }
    collection.remove(session);
  }
}

/** Remove every expired session; used by the periodic housekeeping sweep. */
export async function sweepExpiredSessions(path: string): Promise<number> {
  const collection = await getSessionCollection(path);
  const now = Date.now();
  const expired = collection
    .find({})
    .filter((session) => session.expiresAt <= now);
  for (const session of expired) {
    collection.remove(session);
  }
  return expired.length;
}
