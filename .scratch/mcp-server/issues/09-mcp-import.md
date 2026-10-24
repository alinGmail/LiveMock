# 09: MCP API import

**What to build:** An AI client can import an OpenAPI, Swagger or Postman document into a project and receive the created, overwritten, skipped and failed counts.

**Blocked by:** 03 (MCP foundation and project discovery)

**Status:** ready-for-agent

- [ ] `import_api_spec` accepts a project (id or name), the document content, and an overwrite flag.
- [ ] The existing format detection handles OpenAPI, Swagger and Postman without the MCP layer choosing a format.
- [ ] The result reports created, overwritten, skipped and per-entry failures.
- [ ] Invalid content and unknown projects produce readable errors.
- [ ] The tool is absent when read-only mode is on.
- [ ] MCP tests cover a successful import payload and a parse failure.
