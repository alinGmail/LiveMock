const DOMAIN_GUIDE = `LiveMock is a local mock-server workbench for HTTP APIs, exposed through this server's tools. It is the web edition: the desktop app has no control-plane API. Projects, expectations, groups and logs live in the running LiveMock instance configured by LIVEMOCK_URL. You manage that instance over its /api control plane; you never read or edit its database directly.

# Mental model

Project -> expectations (optionally in groups) -> request logs.

- Project: one named mock listener on its own port (default 8088), with its own expectations, groups and logs. Status is STOPPED or STARTED. Creating a project, an expectation or an import does not start the listener: the project must be STARTED before mock requests are served. The mockBaseUrl returned by project tools is the address for test traffic; the LiveMock /api address is the control plane, not the mock.
- Expectation: one mock rule. When every matcher matches an incoming request, LiveMock runs the expectation's action. Fields: name, description, delay (milliseconds before responding), priority (higher wins), activate (false disables it), groupId (optional), matchers[], actions[]. An expectation with no matchers matches every request; normal rules should include at least a method and/or path. A disabled expectation, or one in an inactive group, never fires.
- Matcher: one test on the request. type=method (HTTP verb), path (URL path only, query string excluded), header (request header name/value), query (query parameter), param (field of a JSON, urlencoded or multipart body). All matchers on one expectation must pass. conditions: IS / IS_NOT exact, CONTAINS / NOT_CONTAINS substring, START_WITH / END_WITH prefix or suffix, MATCH_REGEX / NOT_MATCH_REGEX JavaScript regex (/pattern/flags accepted), MATCH_GLOB / NO_MATCH_GLOB micromatch glob, SHOWED / NOT_SHOWED presence checks that ignore value.
- Action: what a match does. CUSTOM_RESPONSE returns status and responseContent (type JSON or TEXT, value is always a string; stringify JSON bodies; headers are [name, value] pairs; contentHandler MOCK_JS interprets value as a Mock.js JSON template). PROXY forwards to an upstream host, can strip a path prefix with prefixRemove, and can add or replace response headers (headers) and upstream request headers (requestHeaders); pathRewrite is accepted for compatibility but the current engine does not apply it. STATIC_DIRECTORY serves files from folderPath under urlPrefix. LiveMock currently executes the first action of a matched expectation.
- Group: optional named bucket of expectations with its own activate and priority. Deactivating a group disables all its members without deleting them. Match order is block-based: a group is one block ranked by the group's (priority, createTime) descending, while an ungrouped expectation is a block of its own ranked by its own (priority, createTime). Member priorities only order expectations inside their group and never lift a member above another block. The first match wins; among equal block priorities the more recently created block wins. Give specific rules a higher priority than catch-alls.
- Request log: one request handled by a project's mock listener, with request/response headers and bodies, the matched expectationId, status and duration. Logs prove which rule fired and are kept when expectations or groups are deleted. list_logs filters by method, path, pathContains, status (exact code or family such as 2xx), expectationId and request time; conditions are ANDed and repeated values are ORed. filter_logs accepts the same filter object shape as saved log views (property, condition, value) for arbitrary fields and conditions; group filters are not supported. Both are ad-hoc: they never change the saved log views the web UI uses.

# Workflow

1. Discover: list_projects (or get_project) for ids, status and mockBaseUrl. Project arguments accept an id or exact name; an unknown name returns the available candidates.
2. Inspect before writing: list_expectations, get_expectation and list_groups. Prefer updating an existing rule over creating a duplicate. Summaries are compact; use full=true or get_expectation before editing raw matchers and actions.
3. Write: create_expectation from raw matchers/actions, or import_api_spec for OpenAPI 3.x, Swagger 2.0 or a Postman collection. update_expectation is a raw partial update: only supplied fields change, and matchers/actions are replaced wholesale.
4. Run: start_project after creating mocks. Call stop_project before changing a running project's port or deleting the project; stopping releases the port.
5. Verify: send the request to mockBaseUrl, then list_logs / get_log. Narrow the query by method, path, status, expectationId or time instead of paging blindly; use filter_logs when the condition is on a header, query or body field or needs NOT_EQUAL / GREATER. A missing log usually means the project is stopped or no expectation matched; check activate flags, group activation, matcher conditions and priority.
6. Clean up only when asked: deletes are irreversible, and deleting a group also deletes its expectations (request logs are kept).

# Rules of thumb

- Never invent project, expectation or group ids; list them first.
- create_expectation fills structural defaults only: ids, conditions=IS, status=200, JSON content, empty headers, activate=true, priority=0, delay=0, groupId=null. It does not invent names, paths, bodies or upstream hosts.
- responseContent.value is a string: pass the body as text (for JSON, the stringified document), never as a JSON object.
- Ungrouped vs grouped precedence: an ungrouped expectation competes with groups using its own priority. A member of a low-priority group cannot outrank an ungrouped expectation with a higher priority just because the member's own priority is large; raise the group's priority or leave the expectation ungrouped.
- Higher priority is matched first; among equal priorities the newest rule wins.
- Tools return JSON as text. Error messages name the recovery step, for example stop_project before a port change. The server can start when LiveMock is down; connection and token errors appear on the first tool call.`;

export function buildInstructions(readOnly = false): string {
  if (!readOnly) {
    return DOMAIN_GUIDE;
  }
  return (
    DOMAIN_GUIDE +
    "\n\nThis session is read-only: only list/get tools are registered, so write operations are unavailable through this MCP server."
  );
}
