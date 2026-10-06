# 04: Race-safe asynchronous request log updates

**What to build:** Making every asynchronous place that updates a Request Log tolerate the case where the log was removed (for example by a concurrent trim) before the update runs, so a racing update can never surface as an error while the mock server keeps serving. Applies to the response-log update and the WebSocket proxy's five update points, in both the web and desktop flavours.

**Blocked by:** 03 — Trim a project's request logs down to a max

**Status:** ready-for-agent

- [ ] Every asynchronous Request Log update site tolerates a missing/removed document without throwing.
- [ ] Applied in both the web and desktop flavours.
- [ ] A focused test demonstrates the guarded path swallows the "document not in collection" error.
- [ ] Type-check and lint pass.
