# 03: MCP foundation and project discovery

**What to build:** A published-ready `livemock-mcp` stdio server that connects to a running web instance with `LIVEMOCK_URL` and `LIVEMOCK_API_TOKEN`, lists projects with their status and mock base URL, and resolves a project by id or name. Authentication, connection and API errors become readable MCP errors.

**Blocked by:** 01 (API token core and bearer authentication)

**Status:** ready-for-agent

- [ ] The MCP package builds, has a `livemock-mcp` bin, and depends only on the MCP SDK and its Zod peer.
- [ ] `LIVEMOCK_URL` defaults to `http://localhost:9002`; a trailing `/api` is tolerated; `LIVEMOCK_API_TOKEN` is required.
- [ ] The server starts even when LiveMock is unreachable and lists tools; the first tool call reports a clear connection error.
- [ ] `list_projects` and `get_project` work with a Bearer token and include project status, port and mock base URL.
- [ ] A project argument accepts an id or an exact name; unknown or ambiguous names list candidates.
- [ ] `LIVEMOCK_MCP_READ_ONLY` hides write tools; read tools remain.
- [ ] MCP stdio tests use the SDK client and a fake LiveMock HTTP server; they cover tools/list, project discovery, read-only registration and readable auth/connection errors.
