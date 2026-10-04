import { getSession } from "./authStore";
import { getSessionTokenFromCookie } from "./cookies";

/**
 * Socket.IO connection middleware: only handshakes carrying a valid session
 * cookie are accepted. The authenticated username is exposed on socket.data.
 */
export function createSocketAuthMiddleware(dbPath: string) {
  return async (socket: any, next: (err?: Error) => void) => {
    try {
      const token = getSessionTokenFromCookie(socket.handshake.headers.cookie);
      const session = token ? await getSession(dbPath, token) : null;
      if (!session) {
        return next(new Error("unauthorized"));
      }
      socket.data.username = session.username;
      next();
    } catch (err) {
      next(new Error("unauthorized"));
    }
  };
}
