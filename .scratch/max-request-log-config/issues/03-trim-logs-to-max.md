# 03: Trim a project's request logs down to a max

**What to build:** A trimming capability that, given a project's Request Log collection and a maximum, removes the oldest entries so at most `max` remain, keeping the newest, never touching a log whose WebSocket is still open, and reporting which logs it removed so project bookkeeping (the unclosed-WebSocket id list) can be reconciled. The trimming function itself applies no default or minimum — the caller supplies the effective max. Deletion happens as one batch and continues to drive the existing live delete events.

**Blocked by:** 02 — Per-project maximum request log setting

**Status:** ready-for-agent

- [ ] Under or exactly at the limit: nothing is removed.
- [ ] Over the limit: oldest-first removal, so the newest `max` entries remain.
- [ ] Entries whose WebSocket status is OPEN are never removed; older closed entries are still removed.
- [ ] Removal happens as a single batch and the existing dynamic-view delete events still fire.
- [ ] The returned removed ids match exactly what disappeared from the collection.
- [ ] The orchestrator removes those ids from the project's unclosed-WebSocket id list and persists the project.
- [ ] The trimming function applies no clamping or defaulting, so it works with small values such as 100.
- [ ] Jest tests cover: no-op, over-limit, max below current count, OPEN skipped, removed-id correctness, unclosed-id cleanup, and empty collection.
