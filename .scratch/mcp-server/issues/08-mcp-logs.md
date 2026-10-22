# 08: MCP request logs

**What to build:** An AI client can inspect recent request logs for a project and fetch one log in full, so it can diagnose why a mock did or did not match.

**Blocked by:** 03 (MCP foundation and project discovery)

**Status:** ready-for-agent

- [ ] `list_logs` returns method, path, status, duration, matched expectation and timestamp for the newest entries.
- [ ] The default page is 20 entries and the maximum is 100, matching the server's page size.
- [ ] Paging backwards uses the oldest id in the current page.
- [ ] `includeBody=true` adds request and response bodies; the default summary omits them.
- [ ] `get_log` returns the full request and response for one log.
- [ ] Unknown project or log ids produce readable errors.
- [ ] The tools are available in read-only mode.
- [ ] MCP tests cover the summary, body and not-found cases.
