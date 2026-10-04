const FREE_FAILURES = 5;
const MAX_LOCK_MINUTES = 30;
const MINUTE_MS = 60 * 1000;

interface ThrottleEntry {
  failures: number;
  lockedUntil: number;
}

/**
 * In-memory, per-IP login throttle. The first FREE_FAILURES consecutive
 * failures are free; the next one locks the IP for a minute and every further
 * failure doubles the lock, capped at 30 minutes. A successful login or a
 * process restart clears the state. The account itself is never locked.
 */
export class LoginThrottle {
  private entries = new Map<string, ThrottleEntry>();

  check(ip: string): { locked: boolean; retryAfterSeconds: number } {
    const entry = this.entries.get(ip);
    if (!entry || entry.lockedUntil <= Date.now()) {
      return { locked: false, retryAfterSeconds: 0 };
    }
    return {
      locked: true,
      retryAfterSeconds: Math.ceil((entry.lockedUntil - Date.now()) / 1000),
    };
  }

  recordFailure(ip: string): void {
    const entry = this.entries.get(ip) ?? { failures: 0, lockedUntil: 0 };
    entry.failures += 1;
    if (entry.failures >= FREE_FAILURES) {
      const lockMinutes = Math.min(
        2 ** (entry.failures - FREE_FAILURES),
        MAX_LOCK_MINUTES
      );
      entry.lockedUntil = Date.now() + lockMinutes * MINUTE_MS;
    }
    this.entries.set(ip, entry);
  }

  recordSuccess(ip: string): void {
    this.entries.delete(ip);
  }
}
