# LiveMock MCP server (web)

Status: ready-for-agent

## Problem Statement

LiveMock's web dashboard is the only way to manage mock projects, expectations, groups and request logs. An AI coding agent working in an editor has no supported way to inspect or change any of that, so a developer has to translate between the agent's chat and the dashboard by hand: copy a path from the agent, open the right project, create matchers, paste a JSON body, start the project, then copy the resulting mock URL back into the editor. The loop is slow, easy to get wrong, and breaks concentration.

The web version also protects every `/api` endpoint with a single-account login. Handing that account's username and password to an MCP client configuration is a poor trade: the credential is long-lived, grants browser-level access, and cannot be revoked per client.

There is no MCP server, no machine credential for the control plane, and no documentation for connecting an AI client to LiveMock.

## Solution

Ship a standalone MCP server, **`livemock-mcp`**, for the **web version** of LiveMock. It speaks MCP over stdio to the AI client and talks to the running LiveMock web server over its existing `/api` control plane using a revocable **API token**.

Add **API tokens** to the web dashboard's Settings page. A user creates one or more named tokens, sees each token's name, visible prefix, creation time, last-used time and optional expiry, and can revoke any one of them without affecting the others. The full token is shown exactly once and stored only as a hash. Token management and password changes stay behind the browser session: a token can drive the data plane (projects, expectations, groups, logs, imports) but cannot mint or revoke tokens or change the account password. Changing the password or resetting the account revokes every token.

The MCP server exposes project, expectation, group, log and import tools. Matchers and actions are exposed in their **raw LiveMock shapes**, not through a convenience "create a mock" wrapper; structural defaults (IDs, matcher conditions, response-object shape) are filled so that an omission does not create a broken entity. List tools return compact summaries by default and full payloads only on request, keeping the model's context small. An optional read-only environment flag hides write tools for cautious users, but is explicitly a client-side convenience, not a security boundary.

The desktop flavour is untouched: it has no login and no control-plane HTTP server.

## User Stories

1. As a developer using Claude Code, Cursor or Claude Desktop, I want to start the LiveMock MCP server with `npx` and two environment variables, so that I can connect without cloning or building the repository.
2. As a developer, I want `LIVEMOCK_URL` to default to `http://localhost:9002`, so that the common local setup needs only a token.
3. As a developer, I want the MCP server to start even when LiveMock is not running, so that the client can list the available tools and get a clear connection error only when a tool is called.
4. As a developer, I want a missing `LIVEMOCK_API_TOKEN` reported as a configuration error, so that I fix the client config instead of chasing a network problem.
5. As a LiveMock user, I want to create a named API token on the Settings page, so that each client or machine can have its own credential.
6. As a LiveMock user, I want the full token shown exactly once with a copy button, so that I can paste it into a client config and know it cannot be read back later.
7. As a LiveMock user, I want the token list to show name, masked prefix, creation time, last-used time and expiry, so that I can audit which clients are connected.
8. As a LiveMock user, I want to revoke one token without touching the others, so that a leaked or retired client does not force every client to rotate.
9. As a LiveMock user, I want to set an optional expiry in days when creating a token, so that temporary integrations stop working on their own.
10. As a LiveMock user, I want tokens to default to no expiry, so that a local development setup does not break unexpectedly.
11. As a LiveMock user, I want names to be required and unique, so that the list and the revoke action are unambiguous.
12. As a LiveMock user, I want changing the account password to revoke every token, so that a password change also cuts off machine access.
13. As a LiveMock user, I want the `reset-admin` command to revoke every token, so that recovering the account also invalidates old machine credentials.
14. As a LiveMock user, I want token management endpoints to reject Bearer tokens, so that a leaked token cannot create new tokens or revoke existing ones.
15. As a LiveMock user, I want the change-password endpoint to reject Bearer tokens, so that a leaked token cannot change the account password.
16. As a LiveMock user, I want tokens stored only as hashes and displayed only as a short prefix, so that a copy of the database does not expose usable secrets.
17. As a LiveMock user, I want expired tokens rejected and their last use recorded, so that stale credentials stop working and active ones are visible.
18. As a LiveMock user, I want a token to have full data-plane access, so that the MCP client can manage projects, expectations, groups, logs and imports without a second credential.
19. As a LiveMock user, I want the browser session and login flow to behave exactly as before, so that adding tokens does not change the dashboard experience.
20. As a LiveMock user, I want the MCP client to list all projects with their status, port and mock base URL, so that the agent knows what exists and where it is served.
21. As a LiveMock user, I want tools to accept a project id or an exact project name, so that an agent can use whatever identifier the conversation provides.
22. As a LiveMock user, I want an ambiguous or unknown project name to produce a list of candidates, so that the agent can recover without guessing.
23. As a LiveMock user, I want to create a project with a name, description and port, so that a new mock surface can be set up entirely from the editor.
24. As a LiveMock user, I want to update a project's name, description, port and maximum log count, so that routine configuration does not require the dashboard.
25. As a LiveMock user, I want to start a project and receive its mock base URL, so that the agent can immediately tell me where to send traffic.
26. As a LiveMock user, I want to stop a project, so that ports are released without opening the dashboard.
27. As a LiveMock user, I want deleting a running project to fail with a clear reason, so that I understand I must stop it first.
28. As a LiveMock user, I want changing the port of a running project to fail with a clear reason, so that the existing server behaviour is explained rather than hidden.
29. As a LiveMock user, I want to list expectations as compact summaries, so that a large project does not flood the model's context.
30. As a LiveMock user, I want to request a full expectation when I need every field, so that summaries do not block detailed work.
31. As a LiveMock user, I want to fetch one expectation by id, so that I can inspect it before editing it.
32. As a LiveMock user, I want to create an expectation from raw matchers and actions, so that I can express any combination LiveMock supports, not just a canned JSON response.
33. As a LiveMock user, I want to update an expectation with a raw partial payload, so that I can change only the fields I mean to change.
34. As a LiveMock user, I want to delete an expectation by id, so that the mock surface can be cleaned up from the editor.
35. As a LiveMock user, I want missing matcher and action IDs, matcher conditions and response-object fields filled with the same defaults the UI uses, so that a slightly incomplete raw payload still creates a valid entity.
36. As a LiveMock user, I want the tool description to contain a complete worked example of matchers and a custom-response action, so that the raw shape is discoverable without leaving the client.
37. As a LiveMock user, I want to set an expectation's name, description, delay, priority, activation flag and group, so that I can control ordering and behaviour.
38. As a LiveMock user, I want the create-expectation result to hint that the project must be started when it is stopped, so that I do not assume a mock is live when it is not.
39. As a LiveMock user, I want to list, create, update and delete expectation groups, so that group priority and activation can be managed from the editor.
40. As a LiveMock user, I want deleting a group to report that its member expectations were also removed, so that the side effect is not a surprise.
41. As a LiveMock user, I want to list recent request logs with method, path, status, duration, matched expectation and timestamp, so that I can diagnose a mock hit from the editor.
42. As a LiveMock user, I want to page through logs by the oldest id in the current page, so that I can walk backwards through history.
43. As a LiveMock user, I want request and response bodies included only when I ask for them, so that a normal log listing stays small.
44. As a LiveMock user, I want to fetch one log with its full request and response, so that I can debug headers, query and body in detail.
45. As a LiveMock user, I want to import an OpenAPI, Swagger or Postman document, so that a whole API can be mocked without recreating each expectation.
46. As a LiveMock user, I want the import result to report created, overwritten, skipped and failed entries, so that I know what changed.
47. As a LiveMock user, I want an optional read-only mode that hides write tools, so that I can use discovery-only sessions without worrying about accidental changes.
48. As a LiveMock user, I want the documentation to state that read-only mode is not a security boundary, so that I do not mistake it for token permissions.
49. As a LiveMock user, I want authentication, connection, timeout and API errors translated into short readable messages, so that the agent can explain the problem and retry correctly.
50. As a LiveMock user, I want the token never to appear in logs or error messages, so that sharing a transcript does not leak the credential.
51. As a developer, I want setup examples for Claude Code, Claude Desktop and Cursor, so that I can connect my client of choice without reading the source.
52. As a maintainer, I want the MCP package to depend only on the MCP SDK and a schema library, so that publishing it does not drag in the web server or the desktop app.
53. As a maintainer, I want the desktop flavour to remain unchanged, so that its IPC-based model is not disturbed by a web-only control-plane feature.
54. As a maintainer, I want the web token feature covered by the existing composed-API test seam, so that authentication behaviour is tested where the real middleware runs.

## Implementation Decisions

### Architecture

- The MCP server is a new standalone npm package, `livemock-mcp`, in the monorepo's `mcp` workspace. It is published separately from `livemock` and is not embedded in the web backend.
- It uses MCP stdio transport. There is no HTTP/SSE MCP endpoint and no change to the web server's mounting.
- It talks to the existing `/api` control plane over HTTP. It does not read the LiveMock database, does not import the web server's source, and does not require `livemock-core` to be built.
- One MCP process is configured for one LiveMock instance through `LIVEMOCK_URL`.

### API token model

- A new API-token collection lives alongside the existing single account and sessions.
- A token record has: id, name, token hash, visible prefix, creation time, expiry time or none, and last-used time.
- The plaintext token is `lmk_` followed by 64 hexadecimal characters. Only the hash (SHA-256) and a display prefix are stored. The plaintext is returned only by the create call and cannot be retrieved again.
- Names are required, trimmed, 1–64 characters, and unique among existing token records.
- Expiry is optional and expressed in days at creation, with a default of no expiry. Expired tokens are rejected on use and are removed by the same periodic housekeeping that sweeps expired sessions.
- Last-used time is updated on successful authentication, throttled to at most once per minute to avoid a database write per request.
- Revoking a token deletes its record. There is no audit history of revoked tokens in this version.
- Changing the password and resetting the account revoke every token.

### Authentication and authorization

- `requireAuth` first looks for an `Authorization: Bearer <token>` header. A valid, unexpired token authenticates the request as a token principal with full data-plane access. If no bearer header is present, the existing session-cookie path is used unchanged.
- A token can call every data endpoint under `/api` (projects, expectations, groups, logs, import) with the same permissions as the account.
- Token management endpoints and the change-password endpoint require a browser session. A Bearer token receives `403`, even though it has full data-plane access.
- The current-user endpoint remains usable with a Bearer token; it gains an authentication-type field so clients and the dashboard can distinguish a session from a token.
- Socket.IO authentication remains cookie-only. The MCP server does not use Socket.IO, so token access to the socket is out of scope.
- The existing Origin check is unchanged. Non-browser Bearer requests carry no Origin header and continue to pass.

### Token management UI

- The Settings page gains an "API tokens" card below the account and password cards.
- The card lists existing tokens with name, prefix, creation time, last-used time, expiry and a revoke action. Revoking asks for confirmation.
- A create form asks for a name (required) and an expiry choice: never (default), 7, 30, 90 days, or a custom number of days between 1 and 3650.
- A successful create opens a one-time dialog with the full token and a copy action. The token is not shown again after the dialog closes.
- The page uses the existing card, button and modal styling; no new design system is introduced.
- The desktop Settings page is not changed.

### MCP configuration

- `LIVEMOCK_URL` — base URL of the LiveMock web server; default `http://localhost:9002`. A trailing `/api` is tolerated and normalized.
- `LIVEMOCK_API_TOKEN` — required; sent as `Authorization: Bearer`.
- `LIVEMOCK_MCP_READ_ONLY` — optional; when set to a truthy value, write tools are not registered. Documented as a client-side convenience only.
- The MCP server does not contact LiveMock at startup. The first tool call performs authentication and surfaces connection, TLS or credential errors.

### MCP tool surface

The v1 surface is 19 tools:

- Projects: `list_projects`, `get_project`, `create_project`, `update_project`, `delete_project`, `start_project`, `stop_project`.
- Expectations: `list_expectations`, `get_expectation`, `create_expectation`, `update_expectation`, `delete_expectation`.
- Groups: `list_groups`, `create_group`, `update_group`, `delete_group`.
- Logs: `list_logs`, `get_log`.
- Import: `import_api_spec`.

Decisions within the surface:

- There is no `create_mock` convenience tool. `create_expectation` accepts the raw LiveMock `ExpectationM` shape: name, description, delay, priority, activate, group id, matchers and actions.
- Matchers are a discriminated union over method, path, header, query and param, each with the LiveMock condition vocabulary. Actions are a discriminated union over custom response, proxy and static directory.
- To prevent broken entities, the MCP layer fills only structural omissions: missing IDs become UUIDs, missing matcher conditions become `IS`, a custom response defaults to status 200, JSON content, no headers and no content handler, proxy/static array fields default to empty, and expectation defaults are `activate=true`, `priority=0`, `delay=0`, `groupId=null`. It does not invent business values.
- The tool description for `create_expectation` contains a complete worked example: a method matcher, a path matcher and a custom JSON response, plus a proxy example. Common raw-shape mistakes are called out in the parameter descriptions.
- `update_expectation` takes a raw partial update and passes it through the existing update endpoint.
- Project arguments accept an id or an exact name. Resolution is case-sensitive first, then case-insensitive; failures list available candidates.
- `list_expectations` returns summaries by default: id, name, description, activation, priority, delay, group id, matcher summaries and action types with a short body preview. A `full` flag returns the raw expectation objects.
- `list_logs` defaults to 20 entries and caps at 100, matching the server's page size. It accepts the oldest id from the previous page for backward paging. A `includeBody` flag adds request and response bodies; the default summary has method, path, status, duration, matched expectation and timestamp.
- `get_expectation` and `get_log` return the full object.
- Creating an expectation does not start the project. When the project is stopped, the result includes a hint to call `start_project`.
- Deleting a project or expectation is allowed only with the resolved id; the tool description states that deletion is irreversible.
- The read-only flag removes write tools from registration; it does not change the token's server-side permissions.

### MCP package engineering

- The package is ESM, built with TypeScript to `dist/`, with a `livemock-mcp` bin entry and a `prepack` build.
- Runtime dependencies are limited to the MCP SDK and its Zod peer. Node 18 or newer is required, matching the web server.
- The HTTP client is a thin fetch wrapper: base URL normalization, bearer header, JSON/text request and response handling, request timeout, and conversion of LiveMock's error envelope into a typed error.
- Tool results are MCP text content containing readable JSON. Failures set the MCP error flag and contain a short message; stack traces and tokens are never returned.
- List results and error messages are designed to stay small; full payloads require an explicit flag.
- The package has its own README with client configuration examples and a raw `create_expectation` example. The root README gains an MCP section and the agent guide gains the new workspace and commands.

### Compatibility and release

- Desktop is unchanged.
- The first release is `livemock-mcp@0.1.0`, published manually; no CI publish workflow is added in this change.
- The web package version is unchanged.

## Testing Decisions

A good test verifies externally observable behaviour at the highest available seam. It should not assert on private helpers, record layout, or the order of internal calls. The same user-facing contract should hold whether it is reached through HTTP, through the MCP protocol, or through the dashboard.

### Seam 1: the composed web API router (existing seam, highest for auth)

The backend already exposes the full `/api` composition from a single factory, and its auth tests mount it with supertest. Token tests should use that same seam so the real origin check, auth middleware, router mounting and error middleware all run.

Coverage:

- A browser session can create a token and receives the plaintext exactly once; the list returns the prefix and never the plaintext or hash.
- The created token authenticates a data request with `Authorization: Bearer` and no cookie.
- A token cannot create, list or revoke tokens; those requests return 403.
- A token cannot change the password; that request returns 403.
- An expired token is rejected with 401.
- A revoked token is rejected with 401.
- Changing the password revokes every token; resetting the account revokes every token.
- Duplicate and invalid token names are rejected with 400.
- Existing session tests continue to pass unchanged, apart from the current-user response gaining its authentication-type field.

Prior art: the existing auth controller, change-password, throttle and API-router tests.

### Seam 2: the MCP stdio server (new seam, highest for the MCP contract)

Tests should launch the built MCP server and connect to it with the SDK's client and stdio transport. They should assert on `tools/list` and tool results, not on internal modules.

- A fake LiveMock HTTP server exercises the client without a real database: project listing and name resolution, expectation summary versus full output, log summary versus body output, and error translation for 401, 403, 404, 500 and connection failure.
- With the read-only flag set, write tools are absent from `tools/list` and read tools remain.
- The create-expectation call sends the raw matchers and actions, fills structural defaults, and returns the created entity id.
- The connection-refused case produces a readable MCP error rather than a crash or a stack trace.
- A separate opt-in end-to-end script starts a real LiveMock backend with a temporary database, registers the account, creates a token through the Settings API, runs the MCP server against it, creates a project and an expectation, starts the project, sends a request to the mock port, reads the request log, stops and deletes the project, and revokes the token.

Prior art: the backend controller tests use supertest at the router seam; the MCP tests apply the same "highest seam" principle to the stdio boundary. There is no existing MCP test infrastructure, so this is the one new seam.

### Frontend

There is no frontend test runner in the repository. The Settings page change is verified by the production build, lint, and a manual checklist:

- Create a token with and without expiry; the full token appears once and can be copied.
- The list shows prefix, creation, last-used and expiry; refresh preserves the list.
- Revoking asks for confirmation and removes the row; the revoked token stops working.
- Duplicate and empty names show inline errors.
- The page works in the existing light/dark styling.

### Non-goals for testing

- Do not test the hash algorithm or the collection layout directly; test them through the HTTP contract.
- Do not assert on exact error wording beyond the user-visible contract unless the wording is part of the contract.
- Do not require a real backend for the default test run; the end-to-end script is opt-in.

## Out of Scope

- The desktop flavour, its settings page and its IPC model.
- HTTP/SSE/Streamable HTTP MCP transport or an `/api/mcp` endpoint in the web server.
- A token CLI (`livemock token ...`); token management is Settings-page only in this version.
- Token scopes or server-enforced read-only tokens. Read-only is a client-side MCP flag only.
- Any MCP tool that creates, lists or revokes tokens, or changes the account password.
- A `create_mock` convenience tool or other high-level mock recipes; expectations are raw.
- Token audit history, token rotation grace periods, or per-token request logs.
- Socket.IO authentication with Bearer tokens.
- Log filters, log views, live log streaming over Socket.IO, and WebSocket mock message editing.
- Automated npm publishing or CI changes.
- Multi-instance routing from one MCP process.

## Further Notes

- **Why a standalone stdio package:** it needs no backend mounting, works with every mainstream MCP client today, and can be published independently. An embedded remote MCP endpoint can reuse the same tool layer later if remote clients become a requirement.
- **Why tokens instead of the account password:** a token is revocable per client, hashed at rest, can expire, and keeps the single-account password out of editor configuration files.
- **Known trade-off:** tokens have full data-plane access. The Settings page and documentation should say so plainly, and users should treat a token like a password. The read-only MCP flag reduces accidental edits but does not reduce a token's authority.
- **Raw expectations:** choosing raw matchers and actions keeps the full expressive power of LiveMock but shifts more JSON construction onto the model. The worked example in the tool description and README is therefore part of the feature, not decoration.
- **Security boundary:** token management and password change are the only session-only endpoints. Data endpoints deliberately accept tokens so the MCP server can operate without a browser session.
- **Compatibility:** the current-user response gains a field; the existing dashboard must tolerate it and the existing auth tests must be updated at that assertion. No cookie or login behaviour changes.
- **Scaffolding:** a minimal `mcp` workspace with package metadata and TypeScript configuration already exists in the working tree and should be continued rather than recreated.
