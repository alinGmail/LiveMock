# 02: Manage simple view filters

**What to build:** An AI client can add, update and delete simple filters on the project's saved log view. Preset filters are rejected here and handled by the preset tool. Every write returns the changed filter and the latest view.

**Blocked by:** 01: Read the project's saved log view.

**Status:** ready-for-agent

- [ ] `add_view_filter` creates a simple filter, generates a UUID when no id is supplied, validates property/condition/value/activate, rejects GROUP_FILTER and preset filters, and returns `{ filter, logView }`.
- [ ] `update_view_filter` updates only an existing simple filter by id; missing or preset ids produce a clear error.
- [ ] `delete_view_filter` deletes by id and returns `{ removed, logView }`.
- [ ] Writes are hidden in read-only mode; `get_log_view` remains.
- [ ] Shared filter input validation is extracted and used by `filter_logs` and the view tools without changing `filter_logs` behaviour.
- [ ] MCP tests cover add/update/delete, validation, preset rejection and read-only registration; counts are 24 total and 9 read-only.
