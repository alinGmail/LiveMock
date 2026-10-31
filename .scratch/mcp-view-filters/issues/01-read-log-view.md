# 01: Read the project's saved log view

**What to build:** An AI client can read the saved log view for a project, including its filters, through MCP. Projects with no log view or with more than one log view produce a clear error instead of guessing.

**Blocked by:** None (can start immediately).

**Status:** ready-for-agent

- [ ] `get_log_view` accepts a project id or exact name and returns the view id plus its filters (without Loki internal fields).
- [ ] The project's single log view is resolved automatically; zero views reports an actionable error, multiple views reports the available ids.
- [ ] The tool is read-only and remains available in read-only mode.
- [ ] MCP tests cover successful read, zero views, multiple views and read-only registration.
- [ ] Test counts reflect 21 tools total and 9 read-only tools.
