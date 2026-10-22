# 06: MCP raw expectation authoring

**What to build:** An AI client can create, update and delete expectations using LiveMock's raw matchers and actions, with structural defaults that keep an incomplete payload from producing a broken entity. The tool description contains a complete worked example.

**Blocked by:** 05 (MCP expectation discovery)

**Status:** ready-for-agent

- [ ] `create_expectation` accepts a project (id or name) and a raw expectation with name, description, delay, priority, activate, group id, matchers and actions.
- [ ] Matcher variants cover method, path, header, query and param with the full LiveMock condition vocabulary.
- [ ] Action variants cover custom response, proxy and static directory.
- [ ] Missing IDs become UUIDs, missing conditions become `IS`, custom responses default to 200/JSON/no headers/no content handler, proxy and static arrays default to empty, and expectation defaults are activation, priority, delay and group.
- [ ] The tool description and README contain a worked example for a method/path matcher plus a custom JSON response, and a proxy example.
- [ ] `update_expectation` applies a raw partial update; `delete_expectation` deletes by id.
- [ ] A stopped project produces a hint to call `start_project`; the tool does not start it automatically.
- [ ] The tools are absent when read-only mode is on.
- [ ] MCP tests assert the payload sent to the fake server, the defaults, the hint and the error paths.
