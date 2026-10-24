# 10: MCP documentation, packaging and end-to-end verification

**What to build:** A developer can install and configure the MCP server from the documentation, and a full walkthrough proves the web token, the MCP server and a real mock listener work together.

**Blocked by:** 02 (Settings page API token management), 04 (MCP project management), 06 (MCP raw expectation authoring), 07 (MCP expectation groups), 08 (MCP request logs), 09 (MCP API import)

**Status:** ready-for-agent

- [ ] The MCP README documents install, environment variables, Claude Code, Claude Desktop and Cursor configurations, the tool list and a raw expectation example.
- [ ] The root README has a linkable MCP section; the agent guide lists the new workspace and commands.
- [ ] The package builds from a clean checkout and the bin resolves.
- [ ] The opt-in end-to-end script creates a project, creates a raw expectation, starts the project, receives a mock response, reads the request log and cleans up.
- [ ] The script proves a token gets 403 on token management and 401 after revocation.
- [ ] Backend tests, front-end build and lint, and the MCP test suite pass.
