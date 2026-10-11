# 01: Status-family log filtering (backend)

**What to build:** The log-view `IN` filter accepts status-family tokens (`2xx`/`3xx`/`4xx`/`5xx`) alongside exact codes, so a family chip actually matches the right requests.

**Blocked by:** None (can start immediately).

**Status:** ready-for-agent

- [ ] The shared filter translation (web backend and the desktop main-process copy) expands a family token in an `IN` value to an inclusive range (`$gte`/`$lte`), combined with any exact values via `$or`.
- [ ] Exact numeric/string values keep working as before (loose equality and `$in` behaviour unchanged).
- [ ] A filter whose `IN` value is a plain string still works (defensive array handling).
- [ ] Backend tests cover: family-only, exact-only, mixed exact+family, and a family that matches nothing.
- [ ] No change to the shared core model or the socket events.
