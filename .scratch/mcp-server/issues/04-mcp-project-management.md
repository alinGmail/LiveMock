# 04: MCP project management

**What to build:** An AI client can create, update, start, stop and delete a LiveMock project. Starting returns the mock base URL; running-state constraints are explained instead of hidden.

**Blocked by:** 03 (MCP foundation and project discovery)

**Status:** ready-for-agent

- [ ] `create_project` accepts name, optional description and port, and returns the created project.
- [ ] `update_project` changes name, description, port and maximum log count.
- [ ] `start_project` returns the mock base URL; `stop_project` stops the listener.
- [ ] Deleting a running project fails with a readable explanation.
- [ ] Changing the port of a running project fails with a readable explanation.
- [ ] The tools are absent when read-only mode is on.
- [ ] MCP tests cover the happy paths and the two running-state refusals against the fake server.
