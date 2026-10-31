# 03: Update view presets

**What to build:** An AI client can set or remove the three saved log-view presets (expectation, methods, status code) without touching property, condition or activate.

**Blocked by:** 02: Manage simple view filters.

**Status:** ready-for-agent

- [ ] `update_view_preset` accepts `EXPECTATION`, `METHODS` or `STATUS_CODE` plus a value, builds the canonical preset filter and upserts it.
- [ ] Empty string, `null` or empty array removes the preset; the tool returns `{ filter: null, logView }`.
- [ ] Invalid preset names or value shapes produce a clear error; property, condition and activate are not accepted.
- [ ] MCP tests cover all three presets, removal and invalid input; counts are 25 total and 9 read-only.
