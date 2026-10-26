# 04: Document and verify saved-view management

**What to build:** The MCP docs and instructions explain saved-view management versus ad-hoc `filter_logs`, warn that the shared web UI view is modified and does not live-refresh, and the complete suite is verified.

**Blocked by:** 03: Update view presets.

**Status:** ready-for-agent

- [ ] MCP READMEs (English and Chinese) list the five view tools and explain presets, empty-value removal, shared-state last-write-wins and manual refresh.
- [ ] Server instructions tell the model when to use `filter_logs` versus view management, and recommend reading the view before writing.
- [ ] Tool descriptions state that writes affect the web UI's saved view and are not atomic.
- [ ] MCP test suite passes; tool counts and read-only counts are asserted.
- [ ] Desktop code is unchanged; MCP remains web-only.
