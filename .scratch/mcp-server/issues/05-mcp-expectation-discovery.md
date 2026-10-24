# 05: MCP expectation discovery

**What to build:** An AI client can list expectations as compact summaries or full objects, and fetch one expectation, so it can inspect a project's mock surface without flooding its context.

**Blocked by:** 03 (MCP foundation and project discovery)

**Status:** ready-for-agent

- [ ] `list_expectations` returns id, name, description, activation, priority, delay, group id, matcher summaries and action type/body preview by default.
- [ ] `full=true` returns the raw expectation objects.
- [ ] `get_expectation` returns one full expectation by id.
- [ ] Unknown project or expectation ids produce readable errors.
- [ ] The tools are available in read-only mode.
- [ ] MCP tests cover summary versus full output and the not-found case.
