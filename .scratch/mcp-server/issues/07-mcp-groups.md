# 07: MCP expectation groups

**What to build:** An AI client can list, create, update and delete expectation groups, and learns how many member expectations a group deletion removed.

**Blocked by:** 03 (MCP foundation and project discovery)

**Status:** ready-for-agent

- [ ] `list_groups` returns groups with name, activation, priority and creation time.
- [ ] `create_group` accepts an optional name, activation and priority.
- [ ] `update_group` changes name, activation and priority.
- [ ] `delete_group` reports how many member expectations were removed with it.
- [ ] Duplicate group names and unknown group ids produce readable errors.
- [ ] The tools are absent when read-only mode is on.
- [ ] MCP tests cover the CRUD path and the delete side-effect count.
